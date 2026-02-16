import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesContoller } from './categories.controller';
import { PrismaService } from '@app/prisma/prisma.service';
import { CategoryModule } from './categories.module';
import { PrismaModule } from '@app/prisma/prisma.module';

describe('CategoriesController', () => {
  let controller: CategoriesContoller;
  let prismaService: PrismaService;
  let module: TestingModule;
  let testCategory: { id: number; name: string } | null = null;
  let testProducts: { id: number; name: string; quantity: number }[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule, CategoryModule],
    }).compile();

    controller = module.get<CategoriesContoller>(CategoriesContoller);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
    await prismaService.$disconnect();
  });

  describe('getAllCategories', () => {
    beforeEach(async () => {
      testCategory = await prismaService.category.create({
        data: { name: 'Test Category' },
      });
    });

    afterEach(async () => {
      if (testCategory) {
        await prismaService.category
          .delete({ where: { id: testCategory.id } })
          .catch(() => {});
        testCategory = null;
      }
    });

    it('should return a list of categories from the database', async () => {
      const result = await controller.getAllCategories();

      expect(result).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);
    });

    it('should return categories with correct data structure', async () => {
      const result = await controller.getAllCategories();

      const category = result.categories.find((c) => c.id === testCategory!.id);
      expect(category).toBeDefined();
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('created_at');
      expect(category).toHaveProperty('updated_at');
      expect(typeof category?.id).toBe('number');
      expect(typeof category?.name).toBe('string');
    });
  });

  describe('getAllProductsByCategory', () => {
    beforeEach(async () => {
      testProducts = [];

      testCategory = await prismaService.category.create({
        data: { name: 'Test Category With Products' },
      });

      const product1 = await prismaService.product.create({
        data: {
          name: 'Test Product 1',
          quantity: 10,
        },
      });
      const product2 = await prismaService.product.create({
        data: {
          name: 'Test Product 2',
          quantity: 20,
        },
      });

      await prismaService.categoryProduct.create({
        data: { productId: product1.id, categoryId: testCategory.id },
      });
      await prismaService.categoryProduct.create({
        data: { productId: product2.id, categoryId: testCategory.id },
      });

      testProducts = [product1, product2];
    });

    afterEach(async () => {
      await prismaService.categoryProduct
        .deleteMany({ where: { categoryId: testCategory!.id } })
        .catch(() => {});
      for (const product of testProducts) {
        await prismaService.product
          .delete({ where: { id: product.id } })
          .catch(() => {});
      }
      if (testCategory) {
        await prismaService.category
          .delete({ where: { id: testCategory.id } })
          .catch(() => {});
        testCategory = null;
      }
    });

    it('should return all products linked to a category', async () => {
      const result = await controller.getAllProductsByCategory(
        testCategory!.id,
      );

      expect(result).toBeDefined();
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products.length).toBe(2);
      expect(result.products.map((p) => p.id).sort()).toEqual(
        testProducts.map((p) => p.id).sort(),
      );
    });

    it('should return empty array when category has no products', async () => {
      const emptyCategory = await prismaService.category.create({
        data: { name: 'Empty Category' },
      });

      try {
        const result = await controller.getAllProductsByCategory(
          emptyCategory.id,
        );

        expect(result).toBeDefined();
        expect(result.products).toBeDefined();
        expect(Array.isArray(result.products)).toBe(true);
        expect(result.products.length).toBe(0);
      } finally {
        await prismaService.category
          .delete({ where: { id: emptyCategory.id } })
          .catch(() => {});
      }
    });
  });
});
