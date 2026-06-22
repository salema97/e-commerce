import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const supplier = await prisma.supplier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Sample Supplier',
      rucOrId: '9999999999001',
      contactName: 'Juan Perez',
      email: 'supplier@example.com',
      phone: '+593999999999',
      isActive: true,
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: 'sample-category' },
    update: {},
    create: {
      name: 'Sample Category',
      slug: 'sample-category',
      description: 'A placeholder category for initial seed data.',
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { clerkUserId: 'seed_admin_user' },
    update: {},
    create: {
      clerkUserId: 'seed_admin_user',
      email: 'admin@example.com',
      role: 'ADMIN',
      phone: '+593999999998',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'sample-product' },
    update: {},
    create: {
      name: 'Sample Product',
      slug: 'sample-product',
      description: 'A placeholder product for initial seed data.',
      sku: 'SAMPLE-001',
      status: 'ACTIVE',
      price: 19.99,
      compareAtPrice: 24.99,
      cost: 10.0,
      isFeatured: true,
      categoryId: category.id,
      supplierId: supplier.id,
      images: {
        create: {
          url: 'https://placehold.co/600x400',
          alt: 'Sample product image',
          sortOrder: 0,
        },
      },
      attributes: {
        create: [
          { name: 'Color', value: 'Black' },
          { name: 'Material', value: 'Plastic' },
        ],
      },
      variants: {
        create: {
          sku: 'SAMPLE-001-BLK',
          name: 'Black',
          price: 19.99,
        },
      },
      inventory: {
        create: {
          quantity: 100,
          reservedQuantity: 0,
          lowStockThreshold: 10,
        },
      },
    },
  });

  await prisma.invoiceSequence.upsert({
    where: {
      documentType_establishmentCode_emissionPointCode: {
        documentType: '01',
        establishmentCode: process.env.SRI_ESTABLISHMENT_CODE || '001',
        emissionPointCode: process.env.SRI_EMISSION_POINT_CODE || '001',
      },
    },
    update: {},
    create: {
      documentType: '01',
      establishmentCode: process.env.SRI_ESTABLISHMENT_CODE || '001',
      emissionPointCode: process.env.SRI_EMISSION_POINT_CODE || '001',
      startNumber: 1,
      endNumber: 999_999_999,
      currentNumber: 0,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed data created:', { supplier: supplier.name, category: category.name, user: user.email });
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
