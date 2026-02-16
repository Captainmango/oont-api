import { PrismaService } from '@app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { InsufficientStockError } from './errors';

@Injectable()
export class CartsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMostRecentCartByUserId(userId: number) {
    const userCart = await this.prisma.userCart.findFirst({
      where: {
        userId,
        cart: {
          deleted_at: null,
        },
      },
      include: {
        cart: {
          include: {
            products: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        cart: {
          created_at: 'desc',
        },
      },
    });

    return userCart?.cart || null;
  }

  async createCartForUser(userId: number) {
    return this.prisma.cart.create({
      data: {
        users: {
          create: {
            userId,
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
  }

  async findCartProduct(cartId: number, productId: number) {
    return this.prisma.cartProduct.findUnique({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
    });
  }

  async getCartById(cartId: number) {
    return this.prisma.cart.findUnique({
      where: {
        id: cartId,
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

  async removeCartProduct(cartId: number, productId: number) {
    return this.prisma.cartProduct.delete({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
    });
  }

  async deleteUserCart(userId: number) {
    const userCart = await this.prisma.userCart.findFirst({
      where: {
        userId,
        cart: {
          deleted_at: null,
        },
      },
      include: {
        cart: true,
      },
      orderBy: {
        cart: {
          created_at: 'desc',
        },
      },
    });

    if (!userCart) {
      return;
    }

    await this.prisma.cart.update({
      where: {
        id: userCart.cartId,
      },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async addCartProductWithStockCheck(
    cartId: number,
    productId: number,
    quantity: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      if (quantity > product.quantity) {
        throw new InsufficientStockError(productId, quantity, product.quantity);
      }

      return tx.cartProduct.upsert({
        where: {
          cartId_productId: {
            cartId,
            productId,
          },
        },
        update: {
          quantity,
        },
        create: {
          cartId,
          productId,
          quantity,
        },
        include: {
          product: true,
        },
      });
    });
  }

  async updateCartProductQuantityWithStockCheck(
    cartId: number,
    productId: number,
    quantity: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const [product, existingCartProduct] = await Promise.all([
        tx.product.findUnique({
          where: { id: productId },
        }),
        tx.cartProduct.findUnique({
          where: {
            cartId_productId: {
              cartId,
              productId,
            },
          },
        }),
      ]);

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      if (!existingCartProduct) {
        throw new Error(
          `Cart product not found for cart ${cartId} and product ${productId}`,
        );
      }

      const totalQuantity = existingCartProduct.quantity + quantity;

      if (totalQuantity > product.quantity) {
        throw new InsufficientStockError(
          productId,
          totalQuantity,
          product.quantity,
        );
      }

      return tx.cartProduct.update({
        where: {
          cartId_productId: {
            cartId,
            productId,
          },
        },
        data: {
          quantity: {
            increment: quantity,
          },
        },
        include: {
          product: true,
        },
      });
    });
  }

  async setCartProductQuantityWithStockCheck(
    cartId: number,
    productId: number,
    quantity: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      if (quantity > product.quantity) {
        throw new InsufficientStockError(productId, quantity, product.quantity);
      }

      return tx.cartProduct.update({
        where: {
          cartId_productId: {
            cartId,
            productId,
          },
        },
        data: {
          quantity,
        },
        include: {
          product: true,
        },
      });
    });
  }
}
