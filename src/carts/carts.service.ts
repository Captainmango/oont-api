import { BadRequestException, Injectable } from '@nestjs/common';
import { CartsRepository } from './carts.repository';
import { CartEntity } from '@app/shared/entities/cart.entity';
import { CartWithCartProducts } from './dtos/cartWithProducts.dto';
import { ResultAsync, ok, okAsync } from 'neverthrow';
import { CartError, errTypes } from './errors';

interface CartContext {
  cart: CartWithCartProducts;
}

interface CartWithProductContext extends CartContext {
  existingCartProduct: { id: number; productId: number } | null;
}

interface CartIdContext {
  cartId: number;
}

@Injectable()
export class CartsService {
  constructor(private readonly repo: CartsRepository) {}

  getUserCart(userId: number): ResultAsync<CartEntity | null, CartError> {
    return ResultAsync.fromPromise(
      this.repo.findMostRecentCartByUserId(userId),
      (originalError): CartError => ({
        type: errTypes.CART_NOT_FOUND,
        message: 'Failed to retrieve cart for user',
        originalError,
      }),
    ).map((cart) => (cart ? this.transformCartToEntity(cart) : null));
  }

  addItemToCart(
    userId: number,
    productId: number,
    quantity: number,
  ): ResultAsync<CartEntity, CartError> {
    return ResultAsync.fromPromise(
      this.repo.findMostRecentCartByUserId(userId),
      (originalError): CartError => ({
        type: errTypes.CART_NOT_FOUND,
        message: 'Failed to find cart for user',
        originalError,
      }),
    )
      .andThen(this.getOrCreateCart(userId))
      .andThen(this.findCartProduct(productId))
      .andThen(this.upsertCartProduct(productId, quantity))
      .andThen(this.getUpdatedCart())
      .map(this.transformCartToEntity);
  }

  updateCartItem(
    userId: number,
    productId: number,
    quantity: number,
  ): ResultAsync<CartEntity, CartError> {
    return ResultAsync.fromPromise(
      this.repo.findMostRecentCartByUserId(userId),
      (originalError): CartError => ({
        type: errTypes.CART_NOT_FOUND,
        message: 'Failed to find cart for user',
        originalError,
      }),
    )
      .andThen(this.validateCartExists())
      .andThen(this.findCartProduct(productId))
      .andThen(this.validateCartItemExists())
      .andThen(this.setCartItemQuantity(productId, quantity))
      .andThen(this.getUpdatedCart())
      .map(this.transformCartToEntity);
  }

  removeItemFromCart(
    userId: number,
    itemId: number,
  ): ResultAsync<CartEntity, CartError> {
    return ResultAsync.fromPromise(
      this.repo.findMostRecentCartByUserId(userId),
      (originalError): CartError => ({
        type: errTypes.CART_NOT_FOUND,
        message: 'Unable to find user cart',
        originalError,
      }),
    )
      .andThen(this.validateCartExists())
      .andThen(this.findCartProduct(itemId))
      .andThen(this.validateCartItemExists())
      .andThen(this.removeCartProduct(itemId))
      .andThen(this.getUpdatedCart())
      .map(this.transformCartToEntity);
  }

  deleteUserCart(userId: number): ResultAsync<void, CartError> {
    return ResultAsync.fromPromise(
      this.repo.deleteUserCart(userId),
      (originalError): CartError => ({
        type: errTypes.CART_NOT_DELETED,
        message: 'Unable to delete cart',
        originalError,
      }),
    );
  }

  private getOrCreateCart(
    userId: number,
  ): (
    cart: CartWithCartProducts | null,
  ) => ResultAsync<CartContext, CartError> {
    return (cart) => {
      if (cart) {
        return okAsync({ cart });
      }

      return ResultAsync.fromPromise(
        this.repo.createCartForUser(userId),
        (originalError): CartError => ({
          type: errTypes.FAILED_TO_CREATE_CART,
          message: 'Failed to create cart for user',
          originalError,
        }),
      ).map((newCart) => ({ cart: newCart }));
    };
  }

  private upsertCartProduct(
    productId: number,
    quantity: number,
  ): (ctx: CartWithProductContext) => ResultAsync<CartIdContext, CartError> {
    return ({ cart, existingCartProduct }) => {
      if (existingCartProduct) {
        return ResultAsync.fromPromise(
          this.repo.updateCartProductQuantity(cart.id, productId, quantity),
          (originalError): CartError => ({
            type: errTypes.PRODUCT_UPDATE_FAILED,
            message: 'Failed to update product quantity in cart',
            originalError,
          }),
        ).map(() => ({ cartId: cart.id }));
      }

      return ResultAsync.fromPromise(
        this.repo.addCartProduct(cart.id, productId, quantity),
        (originalError): CartError => ({
          type: errTypes.PRODUCT_ADD_FAILED,
          message: 'Failed to add product to cart',
          originalError,
        }),
      ).map(() => ({ cartId: cart.id }));
    };
  }

  private validateCartExists(): (
    cart: CartWithCartProducts | null,
  ) => ResultAsync<CartContext, CartError> {
    return (cart) => {
      if (!cart) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Cart not found')),
          (originalError): CartError => ({
            type: errTypes.CART_NOT_FOUND,
            message: 'Cart not found for user',
            originalError,
          }),
        );
      }
      return okAsync({ cart });
    };
  }

  private findCartProduct(
    productId: number,
  ): (ctx: CartContext) => ResultAsync<CartWithProductContext, CartError> {
    return ({ cart }) => {
      return ResultAsync.fromPromise(
        this.repo.findCartProduct(cart.id, productId),
        (originalError): CartError => ({
          type: errTypes.CART_ITEM_NOT_FOUND,
          message: 'Failed to check if product exists in cart',
          originalError,
        }),
      ).map((existingCartProduct) => ({ cart, existingCartProduct }));
    };
  }

  private setCartItemQuantity(
    productId: number,
    quantity: number,
  ): (ctx: CartWithProductContext) => ResultAsync<CartIdContext, CartError> {
    return ({ cart }) => {
      return ResultAsync.fromPromise(
        this.repo.setCartProductQuantity(cart.id, productId, quantity),
        (originalError): CartError => ({
          type: errTypes.PRODUCT_UPDATE_FAILED,
          message: 'Failed to update cart item quantity',
          originalError,
        }),
      ).map(() => ({ cartId: cart.id }));
    };
  }

  private validateCartItemExists(): (
    ctx: CartWithProductContext,
  ) => ResultAsync<CartWithProductContext, CartError> {
    return (ctx) => {
      if (!ctx.existingCartProduct) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Cart item not found')),
          (originalError): CartError => ({
            type: errTypes.CART_ITEM_NOT_FOUND,
            message: 'Cart item not found',
            originalError,
          }),
        );
      }
      return okAsync(ctx);
    };
  }

  private removeCartProduct(
    itemId: number,
  ): (ctx: CartWithProductContext) => ResultAsync<CartIdContext, CartError> {
    return ({ cart, existingCartProduct }) => {
      return ResultAsync.fromPromise(
        this.repo.removeCartProduct(cart.id, existingCartProduct!.productId),
        (originalError): CartError => ({
          type: errTypes.CART_NOT_DELETED,
          message: 'Failed to remove cart item',
          originalError,
        }),
      ).map(() => ({ cartId: cart.id }));
    };
  }

  private getUpdatedCart(): (
    ctx: CartIdContext,
  ) => ResultAsync<CartWithCartProducts, CartError> {
    return ({ cartId }) => {
      return ResultAsync.fromPromise(
        this.repo.getCartById(cartId),
        (originalError): CartError => ({
          type: errTypes.CART_NOT_FOUND,
          message: 'Failed to retrieve updated cart',
          originalError,
        }),
      ).andThen((cart) => {
        if (!cart) {
          return ResultAsync.fromPromise(
            Promise.reject(new Error('Cart not found')),
            (originalError): CartError => ({
              type: errTypes.CART_NOT_FOUND,
              message: 'Cart not found after update',
              originalError,
            }),
          );
        }
        return okAsync(cart);
      });
    };
  }

  private transformCartToEntity(updatedCart: CartWithCartProducts): CartEntity {
    return {
      ...updatedCart,
      products: updatedCart.products.map((cartProduct) => cartProduct.product),
    };
  }
}
