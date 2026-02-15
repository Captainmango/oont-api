import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import { PrismaService } from '@app/prisma/prisma.service';
import { CartsModule } from './carts.module';
import { PrismaModule } from '@app/prisma/prisma.module';
import { ProductEntity } from '@app/shared/entities/product.entity';

describe('CartsController', () => {
  let controller: CartsController;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, CartsModule],
    }).compile();

    controller = module.get<CartsController>(CartsController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  describe('getUserCart', () => {
    let testUser: { id: number; name: string; email: string } | null = null;
    let testCart: { id: number } | null = null;
    let testProduct: { id: number; name: string; quantity: number } | null =
      null;

    afterEach(async () => {
      if (testCart) {
        await prismaService.cartProduct
          .deleteMany({ where: { cartId: testCart.id } })
          .catch(() => {});
        await prismaService.userCart
          .deleteMany({ where: { cartId: testCart.id } })
          .catch(() => {});
        await prismaService.cart
          .delete({ where: { id: testCart.id } })
          .catch(() => {});
        testCart = null;
      }
      if (testProduct) {
        await prismaService.product
          .delete({ where: { id: testProduct.id } })
          .catch(() => {});
        testProduct = null;
      }
      if (testUser) {
        await prismaService.user
          .delete({ where: { id: testUser.id } })
          .catch(() => {});
        testUser = null;
      }
    });

    it('should return the most recent cart for a user when a cart exists', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User',
          email: `test-cart-user-${Date.now()}@example.com`,
        },
      });

      testCart = await prismaService.cart.create({
        data: {
          users: {
            create: {
              userId: testUser.id,
            },
          },
        },
      });

      const result = await controller.getUserCart(testUser.id);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result?.id).toBe(testCart.id);
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');
    });

    it('should return null when user has no carts', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User No Cart',
          email: `test-no-cart-${Date.now()}@example.com`,
        },
      });

      const result = await controller.getUserCart(testUser.id);

      expect(result).toBeNull();
    });

    it('should return null when all carts are soft deleted', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Deleted Cart',
          email: `test-deleted-cart-${Date.now()}@example.com`,
        },
      });

      testCart = await prismaService.cart.create({
        data: {
          deleted_at: new Date(),
          users: {
            create: {
              userId: testUser.id,
            },
          },
        },
      });

      const result = await controller.getUserCart(testUser.id);

      expect(result).toBeNull();
    });

    it('should return cart with products when cart contains items', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User With Products',
          email: `test-cart-products-${Date.now()}@example.com`,
        },
      });

      testProduct = await prismaService.product.create({
        data: {
          name: 'Test Product',
          quantity: 10,
        },
      });

      testCart = await prismaService.cart.create({
        data: {
          users: {
            create: {
              userId: testUser.id,
            },
          },
          products: {
            create: {
              productId: testProduct.id,
              quantity: 2,
            },
          },
        },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      });

      const result = await controller.getUserCart(testUser.id);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('products');
      expect(Array.isArray(result?.products)).toBe(true);
      expect(result?.products.length).toBe(1);

      const typedResult = result as { products: ProductEntity[] };
      const productResult = typedResult.products[0];
      expect(productResult).toHaveProperty('id');
      expect(productResult.id).toBe(testProduct.id);
      expect(productResult).toHaveProperty('name');
      expect(productResult.name).toBe('Test Product');
      expect(productResult).toHaveProperty('quantity');
      expect(productResult).toHaveProperty('created_at');
      expect(productResult).toHaveProperty('updated_at');
      expect(productResult).not.toHaveProperty('cartId');
      expect(productResult).not.toHaveProperty('productId');
    });
  });

  describe('addItemToCart', () => {
    let testUser: { id: number; name: string; email: string } | null = null;
    let testCart: { id: number } | null = null;
    let testProducts: { id: number; name: string; quantity: number }[] = [];

    afterEach(async () => {
      if (testCart) {
        await prismaService.cartProduct
          .deleteMany({ where: { cartId: testCart.id } })
          .catch(() => {});
        await prismaService.userCart
          .deleteMany({ where: { cartId: testCart.id } })
          .catch(() => {});
        await prismaService.cart
          .delete({ where: { id: testCart.id } })
          .catch(() => {});
        testCart = null;
      }
      for (const product of testProducts) {
        await prismaService.product
          .delete({ where: { id: product.id } })
          .catch(() => {});
      }
      testProducts = [];
      if (testUser) {
        await prismaService.user
          .delete({ where: { id: testUser.id } })
          .catch(() => {});
        testUser = null;
      }
    });

    it('should create a new cart and add item when user has no existing cart', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Add Item New Cart',
          email: `test-add-item-new-${Date.now()}@example.com`,
        },
      });

      const product = await prismaService.product.create({
        data: {
          name: 'Test Product New Cart',
          quantity: 10,
        },
      });
      testProducts.push(product);

      const result = await controller.addItemToCart(testUser.id, product.id, {
        quantity: 3,
      });

      testCart = { id: result.id };

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('products');
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products.length).toBe(1);
      expect(result.products[0]).toHaveProperty('id');
      expect(result.products[0].id).toBe(product.id);
      expect(result.products[0]).toHaveProperty('name');
      expect(result.products[0].name).toBe('Test Product New Cart');
    });

    it('should increment quantity when item already exists in cart', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Add Item Existing',
          email: `test-add-item-existing-${Date.now()}@example.com`,
        },
      });

      const product = await prismaService.product.create({
        data: {
          name: 'Test Product Existing',
          quantity: 10,
        },
      });
      testProducts.push(product);

      testCart = await prismaService.cart.create({
        data: {
          users: {
            create: {
              userId: testUser.id,
            },
          },
          products: {
            create: {
              productId: product.id,
              quantity: 2,
            },
          },
        },
      });

      const result = await controller.addItemToCart(testUser.id, product.id, {
        quantity: 3,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('products');
      expect(result.products.length).toBe(1);

      const cartProduct = await prismaService.cartProduct.findUnique({
        where: {
          cartId_productId: {
            cartId: testCart.id,
            productId: product.id,
          },
        },
      });
      expect(cartProduct?.quantity).toBe(5);
    });

    it('should add different products to existing cart', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Multiple Products',
          email: `test-multiple-products-${Date.now()}@example.com`,
        },
      });

      const product1 = await prismaService.product.create({
        data: {
          name: 'Test Product 1',
          quantity: 10,
        },
      });
      testProducts.push(product1);

      const product2 = await prismaService.product.create({
        data: {
          name: 'Test Product 2',
          quantity: 5,
        },
      });
      testProducts.push(product2);

      testCart = await prismaService.cart.create({
        data: {
          users: {
            create: {
              userId: testUser.id,
            },
          },
          products: {
            create: {
              productId: product1.id,
              quantity: 2,
            },
          },
        },
      });

      const result = await controller.addItemToCart(testUser.id, product2.id, {
        quantity: 3,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('products');
      expect(result.products.length).toBe(2);

      const productIds = result.products.map((p) => p.id).sort();
      expect(productIds).toEqual([product1.id, product2.id].sort());
    });
  });
});
