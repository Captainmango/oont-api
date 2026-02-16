import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { PrismaService } from '@app/prisma/prisma.service';
import { ProductModule } from './products.module';
import { PrismaModule } from '@app/prisma/prisma.module';
import { GetAllProductsDto } from './dtos/getAllProducts.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let prismaService: PrismaService;
  let module: TestingModule;
  let testProducts: { id: number; name: string; quantity: number }[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule, ProductModule],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    testProducts = [];

    const product1 = await prismaService.product.create({
      data: { name: 'Test Product 1', quantity: 10 },
    });
    const product2 = await prismaService.product.create({
      data: { name: 'Test Product 2', quantity: 20 },
    });
    const product3 = await prismaService.product.create({
      data: { name: 'Test Product 3', quantity: 30 },
    });

    testProducts = [product1, product2, product3];
  });

  afterEach(async () => {
    for (const product of testProducts) {
      await prismaService.product
        .delete({ where: { id: product.id } })
        .catch(() => {});
    }
  });

  afterAll(async () => {
    await module.close();
    await prismaService.$disconnect();
  });

  describe('getAllProducts', () => {
    it('should return a list of products from the database', async () => {
      const queryDto: GetAllProductsDto = {};
      const result = await controller.getAllProducts(queryDto);

      expect(result).toBeDefined();
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products.length).toBeGreaterThanOrEqual(3);
    });

    it('should return products with correct data structure', async () => {
      const queryDto: GetAllProductsDto = {};
      const result = await controller.getAllProducts(queryDto);

      const product = result.products.find((p) => p.id === testProducts[0].id);
      expect(product).toBeDefined();
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('quantity');
      expect(product).toHaveProperty('created_at');
      expect(product).toHaveProperty('updated_at');
      expect(typeof product?.id).toBe('number');
      expect(typeof product?.name).toBe('string');
      expect(typeof product?.quantity).toBe('number');
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
      const productId = testProducts[0].id;
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
      const productId = testProducts[0].id;
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
