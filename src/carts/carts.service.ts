import { BadRequestException, Injectable } from '@nestjs/common';
import { CartsRepository } from './carts.repository';
import { CartEntity } from '@app/shared/entities/cart.entity';
import { CartWithCartProducts } from './dtos/cartWithProducts.dto';
import { ResultAsync, ok, okAsync } from 'neverthrow';
import {
  AddItemToCartError,
  DeleteCartError,
  FindCartError,
  RemoveItemFromCartError,
  UpdateCartItemError,
  errTypes,
} from './errors';

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

  getUserCart(userId: number): ResultAsync<CartEntity | null, FindCartError> {
    return ResultAsync.fromPromise(
      this.repo.findMostRecentCartByUserId(userId),
      (): FindCartError => ({
        type: errTypes.CART_NOT_FOUND,
        message: 'Failed to retrieve cart for user',
      }),
    ).map((cart) => (cart ? this.transformCartToEntity(cart) : null));
  }

  addItemToCart(
    userId: number,
    productId: number,
    quantity: number,
  ): ResultAsync<CartEntity, AddItemToCartError> {
    return ResultAsync.fromPromise(
      this.repo.findMostRecentCartByUserId(userId),
      (): AddItemToCartError => ({
        type: errTypes.CART_NOT_FOUND,
        message: 'Failed to find cart for user',
      }),
    )
      .andThen(this.getOrCreateCart(userId))
      .andThen(this.findCartProductForAdd(productId))
      .andThen(this.upsertCartProduct(productId, quantity))
      .andThen(this.getUpdatedCart())
      .map(this.transformCartToEntity);
  }

  updateCartItem(
    userId: number,
    productId: number,
    quantity: number,
  ): ResultAsync<CartEntity, UpdateCartItemError> {
    return ResultAsync.fromPromise(
      this.repo.findMostRecentCartByUserId(userId),
      (): UpdateCartItemError => ({
        type: errTypes.CART_NOT_FOUND,
        message: 'Failed to find cart for user',
      }),
    )
      .andThen(this.validateCartExists())
      .andThen(this.findCartProductForUpdate(productId))
      .andThen(this.validateCartItemExists())
      .andThen(this.setCartItemQuantity(productId, quantity))
      .andThen(this.getUpdatedCartForUpdate())
      .map(this.transformCartToEntity);
  }

  removeItemFromCart(
    userId: number,
    itemId: number,
  ): ResultAsync<CartEntity, RemoveItemFromCartError> {
    return ResultAsync.fromPromise(
      this.repo.findMostRecentCartByUserId(userId),
      (): RemoveItemFromCartError => ({
        type: errTypes.CART_NOT_FOUND,
        message: 'Unable to find user cart',
      }),
    )
      .andThen(this.validateCartExistsForRemove())
      .andThen(this.findCartProductForRemove(itemId))
      .andThen(this.validateCartItemExistsForRemove())
      .andThen(this.removeCartProduct(itemId))
      .andThen(this.getUpdatedCartForRemove())
      .map(this.transformCartToEntity);
  }

  deleteUserCart(userId: number): ResultAsync<void, DeleteCartError> {
    return ResultAsync.fromPromise(
      this.repo.deleteUserCart(userId),
      (): DeleteCartError => ({
        type: errTypes.CART_NOT_DELETED,
        message: 'Unable to delete cart',
      }),
    );
  }

  private getOrCreateCart(
    userId: number,
  ): (
    cart: CartWithCartProducts | null,
  ) => ResultAsync<CartContext, AddItemToCartError> {
    return (cart) => {
      if (cart) {
        return okAsync({ cart });
      }

      return ResultAsync.fromPromise(
        this.repo.createCartForUser(userId),
        (): AddItemToCartError => ({
          type: errTypes.CART_NOT_FOUND,
          message: 'Failed to create cart for user',
        }),
      ).map((newCart) => ({ cart: newCart }));
    };
  }

  private findCartProductForAdd(
    productId: number,
  ): (
    ctx: CartContext,
  ) => ResultAsync<CartWithProductContext, AddItemToCartError> {
    return ({ cart }) => {
      return ResultAsync.fromPromise(
        this.repo.findCartProduct(cart.id, productId),
        (): AddItemToCartError => ({
          type: errTypes.PRODUCT_NOT_FOUND,
          message: 'Failed to check if product exists in cart',
        }),
      ).map((existingCartProduct) => ({ cart, existingCartProduct }));
    };
  }

  private upsertCartProduct(
    productId: number,
    quantity: number,
  ): (
    ctx: CartWithProductContext,
  ) => ResultAsync<CartIdContext, AddItemToCartError> {
    return ({ cart, existingCartProduct }) => {
      if (existingCartProduct) {
        return ResultAsync.fromPromise(
          this.repo.updateCartProductQuantity(cart.id, productId, quantity),
          (): AddItemToCartError => ({
            type: errTypes.PRODUCT_NOT_FOUND,
            message: 'Failed to update product quantity in cart',
          }),
        ).map(() => ({ cartId: cart.id }));
      }

      return ResultAsync.fromPromise(
        this.repo.addCartProduct(cart.id, productId, quantity),
        (): AddItemToCartError => ({
          type: errTypes.PRODUCT_NOT_FOUND,
          message: 'Failed to add product to cart',
        }),
      ).map(() => ({ cartId: cart.id }));
    };
  }

  private validateCartExists(): (
    cart: CartWithCartProducts | null,
  ) => ResultAsync<CartWithCartProducts, UpdateCartItemError> {
    return (cart) => {
      if (!cart) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Cart not found')),
          (): UpdateCartItemError => ({
            type: errTypes.CART_NOT_FOUND,
            message: 'Cart not found for user',
          }),
        );
      }
      return okAsync(cart);
    };
  }

  private findCartProductForUpdate(
    productId: number,
  ): (
    cart: CartWithCartProducts,
  ) => ResultAsync<CartWithProductContext, UpdateCartItemError> {
    return (cart) => {
      return ResultAsync.fromPromise(
        this.repo.findCartProduct(cart.id, productId),
        (): UpdateCartItemError => ({
          type: errTypes.CART_ITEM_NOT_FOUND,
          message: 'Failed to check if product exists in cart',
        }),
      ).map((existingCartProduct) => ({ cart, existingCartProduct }));
    };
  }

  private validateCartItemExists(): (
    ctx: CartWithProductContext,
  ) => ResultAsync<CartWithProductContext, UpdateCartItemError> {
    return (ctx) => {
      if (!ctx.existingCartProduct) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Cart item not found')),
          (): UpdateCartItemError => ({
            type: errTypes.CART_ITEM_NOT_FOUND,
            message: 'Cart item not found',
          }),
        );
      }
      return okAsync(ctx);
    };
  }

  private setCartItemQuantity(
    productId: number,
    quantity: number,
  ): (
    ctx: CartWithProductContext,
  ) => ResultAsync<CartIdContext, UpdateCartItemError> {
    return ({ cart }) => {
      return ResultAsync.fromPromise(
        this.repo.setCartProductQuantity(cart.id, productId, quantity),
        (): UpdateCartItemError => ({
          type: errTypes.PRODUCT_NOT_FOUND,
          message: 'Failed to update cart item quantity',
        }),
      ).map(() => ({ cartId: cart.id }));
    };
  }

  private validateCartExistsForRemove(): (
    cart: CartWithCartProducts | null,
  ) => ResultAsync<CartWithCartProducts, RemoveItemFromCartError> {
    return (cart) => {
      if (!cart) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Cart not found')),
          (): RemoveItemFromCartError => ({
            type: errTypes.CART_NOT_FOUND,
            message: 'Cart not found for user',
          }),
        );
      }
      return okAsync(cart);
    };
  }

  private findCartProductForRemove(
    itemId: number,
  ): (
    cart: CartWithCartProducts,
  ) => ResultAsync<CartWithProductContext, RemoveItemFromCartError> {
    return (cart) => {
      return ResultAsync.fromPromise(
        this.repo.findCartProduct(cart.id, itemId),
        (): RemoveItemFromCartError => ({
          type: errTypes.CART_ITEM_NOT_FOUND,
          message: 'Cart item not found',
        }),
      ).map((existingCartProduct) => ({ cart, existingCartProduct }));
    };
  }

  private validateCartItemExistsForRemove(): (
    ctx: CartWithProductContext,
  ) => ResultAsync<CartWithProductContext, RemoveItemFromCartError> {
    return (ctx) => {
      if (!ctx.existingCartProduct) {
        return ResultAsync.fromPromise(
          Promise.reject(new Error('Cart item not found')),
          (): RemoveItemFromCartError => ({
            type: errTypes.CART_ITEM_NOT_FOUND,
            message: 'Cart item not found',
          }),
        );
      }
      return okAsync(ctx);
    };
  }

  private removeCartProduct(
    itemId: number,
  ): (
    ctx: CartWithProductContext,
  ) => ResultAsync<CartIdContext, RemoveItemFromCartError> {
    return ({ cart, existingCartProduct }) => {
      return ResultAsync.fromPromise(
        this.repo.removeCartProduct(cart.id, existingCartProduct!.productId),
        (): RemoveItemFromCartError => ({
          type: errTypes.CART_ITEM_NOT_FOUND,
          message: 'Failed to remove cart item',
        }),
      ).map(() => ({ cartId: cart.id }));
    };
  }

  private getUpdatedCart(): (
    ctx: CartIdContext,
  ) => ResultAsync<CartWithCartProducts, AddItemToCartError> {
    return ({ cartId }) => {
      return ResultAsync.fromPromise(
        this.repo.getCartById(cartId),
        (): AddItemToCartError => ({
          type: errTypes.CART_NOT_FOUND,
          message: 'Failed to retrieve updated cart',
        }),
      ).andThen((cart) => {
        if (!cart) {
          return ResultAsync.fromPromise(
            Promise.reject(new Error('Cart not found')),
            (): AddItemToCartError => ({
              type: errTypes.CART_NOT_FOUND,
              message: 'Cart not found after update',
            }),
          );
        }
        return okAsync(cart);
      });
    };
  }

  private getUpdatedCartForUpdate(): (
    ctx: CartIdContext,
  ) => ResultAsync<CartWithCartProducts, UpdateCartItemError> {
    return ({ cartId }) => {
      return ResultAsync.fromPromise(
        this.repo.getCartById(cartId),
        (): UpdateCartItemError => ({
          type: errTypes.CART_NOT_FOUND,
          message: 'Failed to retrieve updated cart',
        }),
      ).andThen((cart) => {
        if (!cart) {
          return ResultAsync.fromPromise(
            Promise.reject(new Error('Cart not found')),
            (): UpdateCartItemError => ({
              type: errTypes.CART_NOT_FOUND,
              message: 'Cart not found after update',
            }),
          );
        }
        return okAsync(cart);
      });
    };
  }

  private getUpdatedCartForRemove(): (
    ctx: CartIdContext,
  ) => ResultAsync<CartWithCartProducts, RemoveItemFromCartError> {
    return ({ cartId }) => {
      return ResultAsync.fromPromise(
        this.repo.getCartById(cartId),
        (): RemoveItemFromCartError => ({
          type: errTypes.CART_NOT_FOUND,
          message: 'Unable to find cart after item update',
        }),
      ).andThen((cart) => {
        if (!cart) {
          return ResultAsync.fromPromise(
            Promise.reject(new Error('Cart not found')),
            (): RemoveItemFromCartError => ({
              type: errTypes.CART_NOT_FOUND,
              message: 'Cart not found after update',
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
