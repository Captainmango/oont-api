import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesContoller } from './categories.controller';
import { PrismaService } from '@app/prisma/prisma.service';
import { CategoryModule } from './categories.module';
import { PrismaModule } from '@app/prisma/prisma.module';

describe('CategoriesController', () => {
  let controller: CategoriesContoller;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, CategoryModule],
    }).compile();

    controller = module.get<CategoriesContoller>(CategoriesContoller);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('getAllCategories', () => {
    it('should return a list of categories from the database', async () => {
      const result = await controller.getAllCategories();

      expect(result).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(Array.isArray(result.categories)).toBe(true);
    });

    it('should return categories with correct data structure', async () => {
      const result = await controller.getAllCategories();

      if (result.categories.length > 0) {
        const category = result.categories[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('created_at');
        expect(category).toHaveProperty('updated_at');
        expect(typeof category.id).toBe('number');
        expect(typeof category.name).toBe('string');
      }
    });
  });

  describe('getAllProductsByCategory', () => {
    it('should return all products linked to a category', async () => {
      const result = await controller.getAllProductsByCategory(1); // Electronics in seeder

      expect(result).toBeDefined();
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products.length).toBe(2);
    });

    it('should return empty array when category has no products', async () => {
      const category = await prismaService.category.create({
        data: { name: 'Empty Category' },
      });

      const result = await controller.getAllProductsByCategory(category.id);

      expect(result).toBeDefined();
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products.length).toBe(0);

      await prismaService.category.delete({ where: { id: category.id } });
    });
  });
});
