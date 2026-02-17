import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { PrismaService } from '@app/prisma/prisma.service';
import { OrdersModule } from './orders.module';
import { PrismaModule } from '@app/prisma/prisma.module';

describe('OrdersController', () => {
  let controller: OrdersController;
  let prismaService: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule, OrdersModule],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
    await prismaService.$disconnect();
  });

  describe('placeOrder', () => {
    let testUser: { id: number; name: string; email: string } | null = null;
    let testCart: { id: number } | null = null;
    let testProducts: { id: number; name: string; quantity: number }[] = [];
    let testOrder: { id: number } | null = null;

    afterEach(async () => {
      if (testOrder) {
        await prismaService.orderProduct
          .deleteMany({ where: { orderId: testOrder.id } })
          .catch(() => {});
        await prismaService.userOrder
          .deleteMany({ where: { orderId: testOrder.id } })
          .catch(() => {});
        await prismaService.order
          .delete({ where: { id: testOrder.id } })
          .catch(() => {});
        testOrder = null;
      }
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

    it('should create an order from cart with sufficient stock', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Order',
          email: `test-order-${Date.now()}@example.com`,
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
                quantity: 3,
              },
              {
                productId: product2.id,
                quantity: 2,
              },
            ],
          },
        },
      });

      const initialProduct1 = await prismaService.product.findUnique({
        where: { id: product1.id },
      });
      const initialProduct2 = await prismaService.product.findUnique({
        where: { id: product2.id },
      });
      expect(initialProduct1?.quantity).toBe(10);
      expect(initialProduct2?.quantity).toBe(5);

      const result = await controller.placeOrder({ userId: testUser.id });
      testOrder = { id: result.id };

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status');
      expect(result.products).toHaveLength(2);

      const productIds = result.products.map((p) => p.id).sort();
      expect(productIds).toEqual([product1.id, product2.id].sort());

      const updatedProduct1 = await prismaService.product.findUnique({
        where: { id: product1.id },
      });
      const updatedProduct2 = await prismaService.product.findUnique({
        where: { id: product2.id },
      });

      expect(updatedProduct1?.quantity).toBe(7);
      expect(updatedProduct2?.quantity).toBe(3);

      const orderProducts = await prismaService.orderProduct.findMany({
        where: { orderId: result.id },
      });
      expect(orderProducts).toHaveLength(2);

      const orderProduct1 = orderProducts.find(
        (op) => op.productId === product1.id,
      );
      const orderProduct2 = orderProducts.find(
        (op) => op.productId === product2.id,
      );

      expect(orderProduct1?.quantity).toBe(3);
      expect(orderProduct2?.quantity).toBe(2);

      const userOrder = await prismaService.userOrder.findFirst({
        where: { orderId: result.id },
      });
      expect(userOrder?.userId).toBe(testUser.id);

      const cartAfterOrder = await prismaService.cart.findUnique({
        where: { id: testCart!.id },
      });
      expect(cartAfterOrder?.deleted_at).not.toBeNull();
    });

    it('should rollback transaction when one item would be oversold', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Oversold',
          email: `test-oversold-${Date.now()}@example.com`,
        },
      });

      const product1 = await prismaService.product.create({
        data: {
          name: 'Test Product Sufficient',
          quantity: 10,
        },
      });
      testProducts.push(product1);

      const product2 = await prismaService.product.create({
        data: {
          name: 'Test Product Limited',
          quantity: 2,
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
                quantity: 5,
              },
              {
                productId: product2.id,
                quantity: 5,
              },
            ],
          },
        },
      });

      const initialProduct1 = await prismaService.product.findUnique({
        where: { id: product1.id },
      });
      const initialProduct2 = await prismaService.product.findUnique({
        where: { id: product2.id },
      });
      expect(initialProduct1?.quantity).toBe(10);
      expect(initialProduct2?.quantity).toBe(2);

      await expect(
        controller.placeOrder({ userId: testUser.id }),
      ).rejects.toThrow();

      const product1After = await prismaService.product.findUnique({
        where: { id: product1.id },
      });
      const product2After = await prismaService.product.findUnique({
        where: { id: product2.id },
      });

      expect(product1After?.quantity).toBe(10);
      expect(product2After?.quantity).toBe(2);

      const orders = await prismaService.order.findMany({
        where: {
          users: {
            some: {
              userId: testUser.id,
            },
          },
        },
      });
      expect(orders).toHaveLength(0);
    });

    it('should throw error when cart is empty', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Empty Cart',
          email: `test-empty-cart-${Date.now()}@example.com`,
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

      await expect(
        controller.placeOrder({ userId: testUser.id }),
      ).rejects.toThrow('Cannot place order from empty cart');
    });

    it('should throw error when user has no cart', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User No Cart',
          email: `test-no-cart-${Date.now()}@example.com`,
        },
      });

      await expect(
        controller.placeOrder({ userId: testUser.id }),
      ).rejects.toThrow('Cart not found');
    });
  });

  describe('getOrder', () => {
    let testUser: { id: number; name: string; email: string } | null = null;
    let testProducts: { id: number; name: string; quantity: number }[] = [];
    let testOrder: { id: number } | null = null;

    afterEach(async () => {
      if (testOrder) {
        await prismaService.orderProduct
          .deleteMany({ where: { orderId: testOrder.id } })
          .catch(() => {});
        await prismaService.userOrder
          .deleteMany({ where: { orderId: testOrder.id } })
          .catch(() => {});
        await prismaService.order
          .delete({ where: { id: testOrder.id } })
          .catch(() => {});
        testOrder = null;
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

    it('should return an order by id', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Get Order',
          email: `test-get-order-${Date.now()}@example.com`,
        },
      });

      const product1 = await prismaService.product.create({
        data: {
          name: 'Test Product Get Order 1',
          quantity: 10,
        },
      });
      testProducts.push(product1);

      const product2 = await prismaService.product.create({
        data: {
          name: 'Test Product Get Order 2',
          quantity: 5,
        },
      });
      testProducts.push(product2);

      const createdOrder = await prismaService.order.create({
        data: {
          status: 'Pending',
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
                quantity: 1,
              },
            ],
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
      testOrder = { id: createdOrder.id };

      const result = await controller.getOrder(createdOrder.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdOrder.id);
      expect(result.status).toBe('Pending');
      expect(result.products).toHaveLength(2);

      const productIds = result.products.map((p) => p.id).sort();
      expect(productIds).toEqual([product1.id, product2.id].sort());
    });
  });

  describe('cancelOrder', () => {
    let testUser: { id: number; name: string; email: string } | null = null;
    let testProducts: { id: number; name: string; quantity: number }[] = [];
    let testOrder: { id: number } | null = null;

    afterEach(async () => {
      if (testOrder) {
        await prismaService.orderProduct
          .deleteMany({ where: { orderId: testOrder.id } })
          .catch(() => {});
        await prismaService.userOrder
          .deleteMany({ where: { orderId: testOrder.id } })
          .catch(() => {});
        await prismaService.order
          .delete({ where: { id: testOrder.id } })
          .catch(() => {});
        testOrder = null;
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

    it('should cancel an order and restore product quantities', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Cancel Order',
          email: `test-cancel-order-${Date.now()}@example.com`,
        },
      });

      const product1 = await prismaService.product.create({
        data: {
          name: 'Test Product Cancel 1',
          quantity: 10,
        },
      });
      testProducts.push(product1);

      const product2 = await prismaService.product.create({
        data: {
          name: 'Test Product Cancel 2',
          quantity: 5,
        },
      });
      testProducts.push(product2);

      const createdOrder = await prismaService.order.create({
        data: {
          status: 'Pending',
          users: {
            create: {
              userId: testUser.id,
            },
          },
          products: {
            create: [
              {
                productId: product1.id,
                quantity: 3,
              },
              {
                productId: product2.id,
                quantity: 2,
              },
            ],
          },
        },
        include: {
          products: true,
        },
      });
      testOrder = { id: createdOrder.id };

      await prismaService.product.update({
        where: { id: product1.id },
        data: { quantity: 7 },
      });
      await prismaService.product.update({
        where: { id: product2.id },
        data: { quantity: 3 },
      });

      const product1BeforeCancel = await prismaService.product.findUnique({
        where: { id: product1.id },
      });
      const product2BeforeCancel = await prismaService.product.findUnique({
        where: { id: product2.id },
      });
      expect(product1BeforeCancel?.quantity).toBe(7);
      expect(product2BeforeCancel?.quantity).toBe(3);

      const result = await controller.cancelOrder(createdOrder.id);

      expect(result).toBeUndefined();

      const cancelledOrder = await prismaService.order.findUnique({
        where: { id: createdOrder.id },
      });
      expect(cancelledOrder?.status).toBe('Cancelled');

      const product1AfterCancel = await prismaService.product.findUnique({
        where: { id: product1.id },
      });
      const product2AfterCancel = await prismaService.product.findUnique({
        where: { id: product2.id },
      });
      expect(product1AfterCancel?.quantity).toBe(10);
      expect(product2AfterCancel?.quantity).toBe(5);
    });

    it('should throw error when order does not exist', async () => {
      const nonExistentOrderId = 99999;

      await expect(
        controller.cancelOrder(nonExistentOrderId),
      ).rejects.toThrow();
    });
  });
});
