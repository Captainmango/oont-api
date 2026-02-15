import { PrismaClient } from '@gen-prisma/client';

export async function seedProductCategories(prisma: PrismaClient) {
  const products = await prisma.product.findMany();
  const categories = await prisma.category.findMany();

  const getProductId = (name: string) =>
    products.find((p) => p.name === name)?.id;
  
  const getCategoryId = (name: string) =>
    categories.find((c) => c.name === name)?.id;

  const mappings = [
    { product: 'Wireless Headphones', categories: ['Electronics', 'Audio'] },
    { product: 'Running Shoes', categories: ['Sports', 'Footwear'] },
    { product: 'Coffee Maker', categories: ['Kitchen', 'Appliances'] },
    { product: 'Laptop', categories: ['Electronics', 'Computers'] },
    { product: 'Yoga Mat', categories: ['Sports', 'Fitness'] },
  ];

  for (const mapping of mappings) {
    const productId = getProductId(mapping.product);
    if (!productId) continue;

    for (const categoryName of mapping.categories) {
      const categoryId = getCategoryId(categoryName);
      if (!categoryId) continue;

      console.log(`Linking ${mapping.product} to ${categoryName}...`);
      await prisma.categoryProduct.create({
        data: {
          productId,
          categoryId,
        },
      });
    }
  }
}
