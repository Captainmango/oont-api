import { PrismaClient } from '@gen-prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { productList } from './products';
import { usersList } from './users';
import { categoryList } from './categories';
import { seedProductCategories } from './productsCategories';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

type Entity = {
  [key: string]: any;
};

async function seed<T extends Entity>(list: Array<T>, entity: string) {
  for await (const e of list) {
    console.log(`Seeding ${entity}...`);
    const res = await prisma[entity].create({ data: { ...e } });
  }
}

async function main() {
  await seed(categoryList, 'category');
  await seed(productList, 'product');
  await seedProductCategories(prisma);
  await seed(usersList, 'user');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
