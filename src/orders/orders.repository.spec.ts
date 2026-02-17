import { Test, TestingModule } from '@nestjs/testing';
import { OrdersRepository } from './orders.repository';
import { PrismaService } from '@app/prisma/prisma.service';
import { PrismaModule } from '@app/prisma/prisma.module';

describe('OrdersRepository', () => {
  let repository: OrdersRepository;
  let prismaService: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [OrdersRepository],
    }).compile();

    repository = module.get<OrdersRepository>(OrdersRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
    await prismaService.$disconnect();
  });

  describe('createOrderFromCart', () => {
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

    it('should mark the cart as deleted after creating an order', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User Delete Cart',
          email: `test-delete-cart-${Date.now()}@example.com`,
        },
      });

      const product = await prismaService.product.create({
        data: {
          name: 'Test Product',
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
            create: [
              {
                productId: product.id,
                quantity: 2,
              },
            ],
          },
        },
      });

      const cartBefore = await prismaService.cart.findUnique({
        where: { id: testCart.id },
      });
      expect(cartBefore?.deleted_at).toBeNull();

      const order = await repository.createOrderFromCart(
        testUser.id,
        testCart.id,
        [{ productId: product.id, quantity: 2 }],
      );
      testOrder = { id: order.id };

      const cartAfter = await prismaService.cart.findUnique({
        where: { id: testCart.id },
      });
      expect(cartAfter?.deleted_at).not.toBeNull();
      expect(cartAfter?.deleted_at).toBeInstanceOf(Date);
    });
  });
});
