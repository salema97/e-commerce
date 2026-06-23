import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductSearchSyncService } from '../ai/search/product-search-sync.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

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
    return product;
  }

  findAll() {
    return this.prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
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
    return product;
  }

  async remove(id: string) {
    await this.findOne(id);
    void this.searchSync.removeProduct(id);
    return this.prisma.product.delete({
      where: { id },
      include: productInclude,
    });
  }
}
