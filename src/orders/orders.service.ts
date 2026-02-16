import { Injectable } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CartsRepository } from '@app/carts/carts.repository';
import { OrderEntity } from '@app/shared/entities/order.entity';
import { ResultAsync, okAsync } from 'neverthrow';
import { OrderError, errTypes, InsufficientStockError } from './errors';
import { OrderWithProducts } from './dtos/orderWithProducts.dto';

interface CartContext {
  cart: {
    id: number;
    products: Array<{
      product: { id: number };
      quantity: number;
    }>;
  };
}

interface CartProduct {
  productId: number;
  quantity: number;
}

interface CartProductsContext {
  userId: number;
  cartProducts: CartProduct[];
}

interface CreatedOrderContext {
  userId: number;
  order: OrderWithProducts;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly repo: OrdersRepository,
    private readonly cartsRepo: CartsRepository,
  ) {}

  placeOrder(userId: number): ResultAsync<OrderEntity, OrderError> {
    return ResultAsync.fromPromise(
      this.cartsRepo.findMostRecentCartByUserId(userId),
      (originalError): OrderError => ({
        type: errTypes.CART_NOT_FOUND,
        message: 'Failed to retrieve cart for user',
        originalError,
      }),
    )
      .andThen(this.validateCartExists())
      .andThen(this.validateCartNotEmpty())
      .andThen(this.extractCartProducts(userId))
      .andThen(this.createOrder())
      .map((ctx) => this.transformToEntity(ctx.order));
  }

  getOrder(orderId: number): ResultAsync<OrderEntity, OrderError> {
    return ResultAsync.fromPromise(
      this.repo.getOrderById(orderId),
      (originalError): OrderError => ({
        type: errTypes.ORDER_NOT_FOUND,
        message: 'Unable to find order',
        originalError,
      }),
    ).map((order) => this.transformToEntity(order));
  }

  cancelOrder(orderId: number): ResultAsync<void, OrderError> {
    return ResultAsync.fromPromise(
      this.repo.reverseOrder(orderId),
      (originalError): OrderError => ({
        type: errTypes.ORDER_NOT_FOUND,
        message: 'Unable to find order',
        originalError,
      }),
    ).map(() => undefined);
  }

  private validateCartExists(): (
    cart: CartContext['cart'] | null,
  ) => ResultAsync<CartContext, OrderError> {
    return (cart) => {
      if (!cart) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Cart not found')),
          (originalError): OrderError => ({
            type: errTypes.CART_NOT_FOUND,
            message: 'Cart not found for user',
            originalError,
          }),
        );
      }
      return okAsync({ cart });
    };
  }

  private validateCartNotEmpty(): (
    ctx: CartContext,
  ) => ResultAsync<CartContext, OrderError> {
    return ({ cart }) => {
      if (!cart.products || cart.products.length === 0) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Cannot place order from empty cart')),
          (originalError): OrderError => ({
            type: errTypes.CART_EMPTY,
            message: 'Cannot place order from empty cart',
            originalError,
          }),
        );
      }
      return okAsync({ cart });
    };
  }

  private extractCartProducts(
    userId: number,
  ): (ctx: CartContext) => ResultAsync<CartProductsContext, OrderError> {
    return ({ cart }) => {
      const cartProducts: CartProduct[] = cart.products.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      return okAsync({ userId, cartProducts });
    };
  }

  private createOrder(): (
    ctx: CartProductsContext,
  ) => ResultAsync<CreatedOrderContext, OrderError> {
    return ({ userId, cartProducts }) => {
      return ResultAsync.fromPromise(
        this.repo.createOrderFromCart(userId, cartProducts),
        (originalError): OrderError => {
          if (originalError instanceof InsufficientStockError) {
            return {
              type: errTypes.INSUFFICIENT_STOCK,
              message: `Insufficient stock for product ${originalError.productId}. Available: ${originalError.availableStock}, Requested: ${originalError.requestedQuantity}`,
              originalError,
            };
          }
          return {
            type: errTypes.ORDER_CREATION_FAILED,
            message: 'Failed to create order',
            originalError,
          };
        },
      ).map((order) => ({ userId, order }));
    };
  }

  private transformToEntity(order: OrderWithProducts): OrderEntity {
    return {
      id: order.id,
      status: order.status,
      products: order.products.map((op) => op.product),
      created_at: order.created_at,
      updated_at: order.updated_at,
      deleted_at: order.deleted_at,
    };
  }
}
