import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductSearchSyncService } from '../ai/search/product-search-sync.service.js';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import type { ProductPublicQueryDto } from './dto/product-public-query.dto.js';

const productInclude = {
  category: true,
  supplier: true,
  variants: true,
  attributes: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  inventory: true,
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchSync: ProductSearchSyncService,
    @Inject(EventBus) private readonly eventBus: EventBus,
  ) {}

  async create(data: CreateProductDto) {
    const { variants, attributes, images, ...rest } = data;

    const product = await this.prisma.product.create({
      data: {
        ...rest,
        status: rest.status ?? 'DRAFT',
        variants: variants ? { createMany: { data: variants } } : undefined,
        attributes: attributes ? { createMany: { data: attributes } } : undefined,
        images: images ? { createMany: { data: images } } : undefined,
      },
      include: productInclude,
    });

    void this.searchSync.syncProduct(product.id);
    void this.eventBus.publish({ name: 'product.updated', payload: { productId: product.id } });
    return product;
  }

  findAll() {
    return this.prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStoreProducts(query: ProductPublicQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 24));
    const where = {
      status: 'ACTIVE' as const,
      ...(query.category ? { category: { slug: query.category } } : {}),
    };

    const orderBy = (() => {
      switch (query.sort) {
        case 'price_asc':
          return { price: 'asc' as const };
        case 'price_desc':
          return { price: 'desc' as const };
        case 'name_asc':
          return { name: 'asc' as const };
        case 'newest':
        default:
          return { createdAt: 'desc' as const };
      }
    })();

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          compareAtPrice: true,
          isFeatured: true,
          createdAt: true,
          categoryId: true,
          images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true, alt: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        price: Number(item.price),
        compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
        images: item.images,
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }
    return product;
  }

  async update(id: string, data: UpdateProductDto) {
    await this.findOne(id);
    const { variants, attributes, images, ...rest } = data;

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        variants: variants ? { createMany: { data: variants } } : undefined,
        attributes: attributes ? { createMany: { data: attributes } } : undefined,
        images: images ? { createMany: { data: images } } : undefined,
      },
      include: productInclude,
    });

    void this.searchSync.syncProduct(product.id);
    void this.eventBus.publish({ name: 'product.updated', payload: { productId: product.id } });
    return product;
  }

  async remove(id: string) {
    await this.findOne(id);
    void this.searchSync.removeProduct(id);
    void this.eventBus.publish({ name: 'product.deleted', payload: { productId: id } });
    return this.prisma.product.delete({
      where: { id },
      include: productInclude,
    });
  }
}
