import { PrismaService } from '@app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

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

  async addCartProduct(cartId: number, productId: number, quantity: number) {
    return this.prisma.cartProduct.create({
      data: {
        cartId,
        productId,
        quantity,
      },
      include: {
        product: true,
      },
    });
  }

  async updateCartProductQuantity(
    cartId: number,
    productId: number,
    quantity: number,
  ) {
    return this.prisma.cartProduct.update({
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

  async setCartProductQuantity(
    cartId: number,
    productId: number,
    quantity: number,
  ) {
    return this.prisma.cartProduct.update({
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
}
