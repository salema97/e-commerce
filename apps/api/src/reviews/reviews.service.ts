import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductSearchSyncService } from '../ai/search/product-search-sync.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { CreateProductReviewDto } from './dto/review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchSync: ProductSearchSyncService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async create(productId: string, userId: string, dto: CreateProductReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const existing = await this.prisma.productReview.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) {
      throw new ConflictException('You already reviewed this product');
    }

    const verifiedOrder = await this.findVerifiedOrder(userId, productId, dto.orderId);

    const review = await this.prisma.productReview.create({
      data: {
        productId,
        userId,
        orderId: verifiedOrder?.id,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        isVerifiedPurchase: Boolean(verifiedOrder),
        status: ReviewStatus.PENDING,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    return review;
  }

  async listByProduct(productId: string, approvedOnly = true) {
    return this.prisma.productReview.findMany({
      where: {
        productId,
        ...(approvedOnly ? { status: ReviewStatus.APPROVED } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
  }

  async summary(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { averageRating: true, reviewCount: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const distributionRows = await this.prisma.productReview.groupBy({
      by: ['rating'],
      where: { productId, status: ReviewStatus.APPROVED },
      _count: { rating: true },
    });

    const distribution = Object.fromEntries(
      distributionRows.map((row) => [String(row.rating), row._count.rating]),
    );

    return {
      averageRating: product.averageRating ? Number(product.averageRating) : 0,
      reviewCount: product.reviewCount,
      distribution,
    };
  }

  async listPending(limit = 50) {
    return this.prisma.productReview.findMany({
      where: { status: ReviewStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async moderate(reviewId: string, status: ReviewStatus) {
    const review = await this.prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    const updated = await this.prisma.productReview.update({
      where: { id: reviewId },
      data: { status },
    });

    if (status === ReviewStatus.APPROVED) {
      await this.recalculateProductRating(review.productId);
      if (review.userId) {
        await this.loyaltyService.earnForReview(review.userId, review.id);
      }
    }

    if (status === ReviewStatus.REJECTED && review.status === ReviewStatus.APPROVED) {
      await this.recalculateProductRating(review.productId);
    }

    return updated;
  }

  private async findVerifiedOrder(userId: string, productId: string, orderId?: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'PARTIALLY_SHIPPED'] },
        ...(orderId ? { id: orderId } : {}),
        items: { some: { productId } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    return orders[0] ?? null;
  }

  private async recalculateProductRating(productId: string) {
    const aggregate = await this.prisma.productReview.aggregate({
      where: { productId, status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: aggregate._avg.rating ?? null,
        reviewCount: aggregate._count.rating,
      },
    });

    void this.searchSync.syncProduct(productId);
  }
}
