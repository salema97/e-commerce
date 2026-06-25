import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditBeforeStateRegistry } from './audit-before-state.registry.js';

const productInclude = {
  category: true,
  supplier: true,
  variants: true,
  attributes: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  inventory: true,
};

@Injectable()
export class AuditResourceRegistrationService implements OnModuleInit {
  constructor(
    private readonly registry: AuditBeforeStateRegistry,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.registry.register('product', (id) =>
      this.prisma.product.findUnique({ where: { id }, include: productInclude }),
    );
    this.registry.register('category', (id) =>
      this.prisma.category.findUnique({ where: { id } }),
    );
    this.registry.register('user', (id) =>
      this.prisma.user.findUnique({ where: { id } }),
    );
    this.registry.register('supplier', (id) =>
      this.prisma.supplier.findUnique({ where: { id } }),
    );
    this.registry.register('inventory', (id) =>
      this.prisma.inventory.findUnique({ where: { id } }),
    );
    this.registry.register('conversation', (id) =>
      this.prisma.conversation.findUnique({ where: { id } }),
    );
    this.registry.register('expense', (id) =>
      this.prisma.expense.findUnique({ where: { id } }),
    );
    this.registry.register('expense_category', (id) =>
      this.prisma.expenseCategory.findUnique({ where: { id } }),
    );
    this.registry.register('income', (id) =>
      this.prisma.income.findUnique({ where: { id } }),
    );
    this.registry.register('faq', (id) => this.prisma.faq.findUnique({ where: { id } }));
    this.registry.register('cms_page', (id) =>
      this.prisma.cmsPage.findUnique({ where: { id } }),
    );
  }
}
