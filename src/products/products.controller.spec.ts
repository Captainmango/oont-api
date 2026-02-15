import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { PrismaService } from '@app/prisma/prisma.service';
import { ProductModule } from './products.module';
import { PrismaModule } from '@app/prisma/prisma.module';
import { GetAllProductsDto } from './dtos/getAllProducts.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ProductModule],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('getAllProducts', () => {
    it('should return a list of products from the database', async () => {
      const queryDto: GetAllProductsDto = {};
      const result = await controller.getAllProducts(queryDto);

      expect(result).toBeDefined();
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
    });

    it('should return products with correct data structure', async () => {
      const queryDto: GetAllProductsDto = {};
      const result = await controller.getAllProducts(queryDto);

      if (result.products.length > 0) {
        const product = result.products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('quantity');
        expect(product).toHaveProperty('created_at');
        expect(product).toHaveProperty('updated_at');
        expect(typeof product.id).toBe('number');
        expect(typeof product.name).toBe('string');
        expect(typeof product.quantity).toBe('number');
      }
    });

    it('should support pagination with page and pageSize', async () => {
      const queryDto: GetAllProductsDto = { page: 1, pageSize: 2 };
      const result = await controller.getAllProducts(queryDto);

      expect(result.products).toBeDefined();
      expect(result.products.length).toBeLessThanOrEqual(2);
    });

    it('should return different products for different pages', async () => {
      const page1Dto: GetAllProductsDto = { page: 1, pageSize: 2 };
      const page2Dto: GetAllProductsDto = { page: 2, pageSize: 2 };
      const page1 = await controller.getAllProducts(page1Dto);
      const page2 = await controller.getAllProducts(page2Dto);

      if (page1.products.length > 0 && page2.products.length > 0) {
        expect(page1.products[0].id).not.toBe(page2.products[0].id);
      }
    });

    it('should use default pagination when no params provided', async () => {
      const queryDto: GetAllProductsDto = {};
      const result = await controller.getAllProducts(queryDto);

      expect(result.products).toBeDefined();
      expect(result.products.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getProductById', () => {
    it('should return a product when given a valid id', async () => {
      const allProducts = await controller.getAllProducts({
        page: 1,
        pageSize: 1,
      });

      if (allProducts.products.length === 0) {
        throw new Error(
          'There is no data in the database. Have you run the seeder?',
        );
      }

      const productId = allProducts.products[0].id;
      const result = await controller.getProductById(productId);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('quantity');
      expect(result?.id).toBe(productId);
    });

    it('should return null when product does not exist', async () => {
      const result = await controller.getProductById(999999);

      expect(result).toBeNull();
    });

    it('should return product with correct data structure', async () => {
      const allProducts = await controller.getAllProducts({
        page: 1,
        pageSize: 1,
      });

      if (allProducts.products.length === 0) {
        throw new Error(
          'There is no data in the database. Have you run the seeder?',
        );
      }

      const productId = allProducts.products[0].id;
      const result = await controller.getProductById(productId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('quantity');
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');
      expect(typeof result?.id).toBe('number');
      expect(typeof result?.name).toBe('string');
      expect(typeof result?.quantity).toBe('number');
    });
  });
});
