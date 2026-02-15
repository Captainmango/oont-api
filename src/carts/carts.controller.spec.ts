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

      const result = await controller.addItemToCart(testUser.id, {
        productId: product.id,
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

      const result = await controller.addItemToCart(testUser.id, {
        productId: product.id,
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

      const result = await controller.addItemToCart(testUser.id, {
        productId: product2.id,
        quantity: 3,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('products');
      expect(result.products.length).toBe(2);

      const productIds = result.products.map((p) => p.id).sort();
      expect(productIds).toEqual([product1.id, product2.id].sort());
    });
  });

  describe('updateCartItem', () => {
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

    it('should update the quantity of an existing cart item', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Update Cart Item',
          email: `test-update-cart-item-${Date.now()}@example.com`,
        },
      });

      testProduct = await prismaService.product.create({
        data: {
          name: 'Test Product Update',
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
      });

      const result = await controller.updateCartItem(
        testUser.id,
        testProduct.id,
        {
          quantity: 5,
        },
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('products');
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products.length).toBe(1);
      expect(result.products[0]).toHaveProperty('id');
      expect(result.products[0].id).toBe(testProduct.id);

      const cartProduct = await prismaService.cartProduct.findUnique({
        where: {
          cartId_productId: {
            cartId: testCart.id,
            productId: testProduct.id,
          },
        },
      });
      expect(cartProduct?.quantity).toBe(5);
    });
  });

  describe('removeItemFromCart', () => {
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

    it('should remove an item from the cart', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Remove Item',
          email: `test-remove-item-${Date.now()}@example.com`,
        },
      });

      const product = await prismaService.product.create({
        data: {
          name: 'Test Product Remove',
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

      const result = await controller.removeItemFromCart(
        testUser.id,
        product.id,
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('products');
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products.length).toBe(0);

      const cartProduct = await prismaService.cartProduct.findUnique({
        where: {
          cartId_productId: {
            cartId: testCart.id,
            productId: product.id,
          },
        },
      });
      expect(cartProduct).toBeNull();
    });

    it('should remove only the specified item when cart has multiple items', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Remove One Item',
          email: `test-remove-one-item-${Date.now()}@example.com`,
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
            create: [
              {
                productId: product1.id,
                quantity: 2,
              },
              {
                productId: product2.id,
                quantity: 3,
              },
            ],
          },
        },
      });

      const result = await controller.removeItemFromCart(
        testUser.id,
        product1.id,
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('products');
      expect(result.products.length).toBe(1);
      expect(result.products[0].id).toBe(product2.id);
      expect(result.products[0].name).toBe('Test Product 2');

      const removedCartProduct = await prismaService.cartProduct.findUnique({
        where: {
          cartId_productId: {
            cartId: testCart.id,
            productId: product1.id,
          },
        },
      });
      expect(removedCartProduct).toBeNull();

      const remainingCartProduct = await prismaService.cartProduct.findUnique({
        where: {
          cartId_productId: {
            cartId: testCart.id,
            productId: product2.id,
          },
        },
      });
      expect(remainingCartProduct).not.toBeNull();
      expect(remainingCartProduct?.quantity).toBe(3);
    });
  });

  describe('deleteCart', () => {
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

    it('should soft delete the cart by setting deleted_at timestamp', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Delete Cart',
          email: `test-delete-cart-${Date.now()}@example.com`,
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

      await controller.deleteCart(testUser.id);

      const deletedCart = await prismaService.cart.findUnique({
        where: { id: testCart.id },
      });

      expect(deletedCart).toBeDefined();
      expect(deletedCart?.deleted_at).not.toBeNull();
      expect(deletedCart?.deleted_at).toBeInstanceOf(Date);
    });

    it('should keep cart items intact when deleting cart', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Delete Cart With Items',
          email: `test-delete-cart-items-${Date.now()}@example.com`,
        },
      });

      testProduct = await prismaService.product.create({
        data: {
          name: 'Test Product Delete Cart',
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
              quantity: 5,
            },
          },
        },
      });

      await controller.deleteCart(testUser.id);

      const cartProducts = await prismaService.cartProduct.findMany({
        where: { cartId: testCart.id },
      });

      expect(cartProducts).toHaveLength(1);
      expect(cartProducts[0].productId).toBe(testProduct.id);
      expect(cartProducts[0].quantity).toBe(5);
    });

    it('should handle deleting cart when user has no active cart', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User No Active Cart',
          email: `test-no-active-cart-${Date.now()}@example.com`,
        },
      });

      await expect(controller.deleteCart(testUser.id)).resolves.toBeUndefined();
    });

    it('should only delete the most recent active cart', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Multiple Carts',
          email: `test-multiple-carts-${Date.now()}@example.com`,
        },
      });

      const oldCart = await prismaService.cart.create({
        data: {
          created_at: new Date(Date.now() - 86400000),
          users: {
            create: {
              userId: testUser.id,
            },
          },
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

      await controller.deleteCart(testUser.id);

      const recentCart = await prismaService.cart.findUnique({
        where: { id: testCart.id },
      });
      const previousCart = await prismaService.cart.findUnique({
        where: { id: oldCart.id },
      });

      expect(recentCart?.deleted_at).not.toBeNull();
      expect(previousCart?.deleted_at).toBeNull();

      await prismaService.userCart.deleteMany({
        where: { cartId: oldCart.id },
      });
      await prismaService.cart.delete({ where: { id: oldCart.id } });
    });
  });
});
