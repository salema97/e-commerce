import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type AuditBeforeStateLoader = (id: string) => Promise<unknown>;

const productInclude = {
  category: true,
  supplier: true,
  variants: true,
  attributes: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  inventory: true,
};

@Injectable()
export class AuditBeforeStateRegistry implements OnModuleInit {
  private readonly loaders = new Map<string, AuditBeforeStateLoader>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.register('product', (id) =>
      this.prisma.product.findUnique({ where: { id }, include: productInclude }),
    );
    this.register('category', (id) => this.prisma.category.findUnique({ where: { id } }));
    this.register('user', (id) => this.prisma.user.findUnique({ where: { id } }));
    this.register('supplier', (id) => this.prisma.supplier.findUnique({ where: { id } }));
    this.register('inventory', (id) => this.prisma.inventory.findUnique({ where: { id } }));
    this.register('conversation', (id) =>
      this.prisma.conversation.findUnique({ where: { id } }),
    );
    this.register('expense', (id) => this.prisma.expense.findUnique({ where: { id } }));
    this.register('expense_category', (id) =>
      this.prisma.expenseCategory.findUnique({ where: { id } }),
    );
    this.register('income', (id) => this.prisma.income.findUnique({ where: { id } }));
    this.register('faq', (id) => this.prisma.faq.findUnique({ where: { id } }));
    this.register('cms_page', (id) => this.prisma.cmsPage.findUnique({ where: { id } }));
  }

  register(resource: string, loader: AuditBeforeStateLoader): void {
    this.loaders.set(resource, loader);
  }

  async load(resource: string, id: string): Promise<unknown | null> {
    const loader = this.loaders.get(resource);
    if (!loader) {
      return null;
    }

    try {
      return await loader(id);
    } catch {
      return null;
    }
  }
}
