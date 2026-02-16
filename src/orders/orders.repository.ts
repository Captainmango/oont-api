import { PrismaService } from '@app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@gen-prisma/browser';
import { InsufficientStockError } from './errors';
import { Prisma } from '@gen-prisma/client';

interface CartProduct {
  productId: number;
  quantity: number;
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrderFromCart(userId: number, cartProducts: CartProduct[]) {
    return this.prisma.$transaction(
      async (tx) => {
        if (cartProducts.length === 0) {
          throw new Error('Cannot create order from empty cart');
        }

        const productIds = cartProducts.map((cp) => cp.productId);

        const updateResult = await tx.$executeRaw`
        UPDATE "products"
        SET quantity = quantity - CASE id
          ${Prisma.raw(
            cartProducts
              .map((cp) => `WHEN ${cp.productId} THEN ${cp.quantity}`)
              .join(' '),
          )}
        END
        WHERE id = ANY(${productIds}::int[])
          AND CASE id
            ${Prisma.raw(
              cartProducts
                .map(
                  (cp) =>
                    `WHEN ${cp.productId} THEN quantity >= ${cp.quantity}`,
                )
                .join(' '),
            )}
          END
      `;

        if (updateResult !== cartProducts.length) {
          const products = await tx.product.findMany({
            where: {
              id: {
                in: productIds,
              },
            },
          });

          const productMap = new Map(products.map((p) => [p.id, p]));

          for (const cartProduct of cartProducts) {
            const product = productMap.get(cartProduct.productId);

            if (!product) {
              throw new Error(`Product ${cartProduct.productId} not found`);
            }

            if (cartProduct.quantity > product.quantity) {
              throw new InsufficientStockError(
                cartProduct.productId,
                cartProduct.quantity,
                product.quantity,
              );
            }
          }

          // Bail out because something went very wrong
          throw new Error('Failed to update product quantities');
        }

        const order = await tx.order.create({
          data: {
            status: OrderStatus.Pending,
            users: {
              create: {
                userId,
              },
            },
            products: {
              create: cartProducts.map((cp) => ({
                productId: cp.productId,
                quantity: cp.quantity,
              })),
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

        return order;
      },
      {
        isolationLevel: 'ReadCommitted',
      },
    );
  }

  async getOrderById(orderId: number) {
    return await this.prisma.order.findUniqueOrThrow({
      where: {
        id: orderId,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async reverseOrder(orderId: number) {
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: {
            id: orderId,
          },
          include: {
            products: true,
          },
        });

        if (!order) {
          throw new Error(`Order ${orderId} not found`);
        }

        for (const orderProduct of order.products) {
          await tx.product.update({
            where: {
              id: orderProduct.productId,
            },
            data: {
              quantity: {
                increment: orderProduct.quantity,
              },
            },
          });
        }

        const updatedOrder = await tx.order.update({
          where: {
            id: orderId,
          },
          data: {
            status: OrderStatus.Cancelled,
          },
          include: {
            products: {
              include: {
                product: true,
              },
            },
          },
        });

        return updatedOrder;
      },
      {
        isolationLevel: 'ReadCommitted',
      },
    );
  }
}
