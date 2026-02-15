import { BadRequestException, Injectable } from '@nestjs/common';
import { CartsRepository } from './carts.repository';
import { CartEntity } from '@app/shared/entities/cart.entity';
import { CartWithCartProducts } from './dtos/cartWithProducts.dto';
import { ResultAsync, ok } from 'neverthrow';
import {
  AddItemToCartError,
  RemoveItemFromCartError,
  UpdateCartItemError,
  errTypes,
} from './errors';

@Injectable()
export class CartsService {
  constructor(private readonly repo: CartsRepository) {}

  async getUserCart(userId: number): Promise<CartEntity | null> {
    const cart = await this.repo.findMostRecentCartByUserId(userId);

    if (!cart) {
      return null;
    }

    const cartWithProducts: CartWithCartProducts = cart;

    return {
      ...cart,
      products: cartWithProducts.products.map(
        (cartProduct) => cartProduct.product,
      ),
    };
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
      .map((cart) => ({ cart }))
      .andThen(({ cart }) => {
        if (cart) {
          return ok({ cart });
        }

        return ResultAsync.fromPromise(
          this.repo.createCartForUser(userId),
          (): AddItemToCartError => ({
            type: errTypes.CART_NOT_FOUND,
            message: 'Failed to create cart for user',
          }),
        ).map((newCart) => ({ cart: newCart }));
      })
      .andThen(({ cart }) => {
        return ResultAsync.fromPromise(
          this.repo.findCartProduct(cart.id, productId),
          (): AddItemToCartError => ({
            type: errTypes.PRODUCT_NOT_FOUND,
            message: 'Failed to check if product exists in cart',
          }),
        ).map((existingCartProduct) => ({ cart, existingCartProduct }));
      })
      .andThen(({ cart, existingCartProduct }) => {
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
      })
      .andThen(({ cartId }) => {
        return ResultAsync.fromPromise(
          this.repo.getCartById(cartId),
          (): AddItemToCartError => ({
            type: errTypes.CART_NOT_FOUND,
            message: 'Failed to retrieve updated cart',
          }),
        );
      })
      .map((updatedCart) => {
        if (!updatedCart) {
          throw new BadRequestException('Cart not found after update');
        }

        return {
          ...updatedCart,
          products: updatedCart.products.map(
            (cartProduct) => cartProduct.product,
          ),
        };
      });
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
      .andThen((cart) => {
        if (!cart) {
          return ResultAsync.fromPromise(
            Promise.reject(new Error('Cart not found')),
            (): UpdateCartItemError => ({
              type: errTypes.CART_NOT_FOUND,
              message: 'Cart not found for user',
            }),
          );
        }
        return ok(cart);
      })
      .andThen((cart) => {
        return ResultAsync.fromPromise(
          this.repo.findCartProduct(cart.id, productId),
          (): UpdateCartItemError => ({
            type: errTypes.CART_ITEM_NOT_FOUND,
            message: 'Failed to check if product exists in cart',
          }),
        ).map((existingCartProduct) => ({ cart, existingCartProduct }));
      })
      .andThen(({ cart, existingCartProduct }) => {
        if (!existingCartProduct) {
          return ResultAsync.fromPromise(
            Promise.reject(new Error('Cart item not found')),
            (): UpdateCartItemError => ({
              type: errTypes.CART_ITEM_NOT_FOUND,
              message: 'Cart item not found',
            }),
          );
        }
        return ResultAsync.fromPromise(
          this.repo.setCartProductQuantity(cart.id, productId, quantity),
          (): UpdateCartItemError => ({
            type: errTypes.PRODUCT_NOT_FOUND,
            message: 'Failed to update cart item quantity',
          }),
        ).map(() => ({ cartId: cart.id }));
      })
      .andThen(({ cartId }) => {
        return ResultAsync.fromPromise(
          this.repo.getCartById(cartId),
          (): UpdateCartItemError => ({
            type: errTypes.CART_NOT_FOUND,
            message: 'Failed to retrieve updated cart',
          }),
        );
      })
      .map((updatedCart) => {
        if (!updatedCart) {
          throw new BadRequestException('Cart not found after update');
        }

        return {
          ...updatedCart,
          products: updatedCart.products.map(
            (cartProduct) => cartProduct.product,
          ),
        };
      });
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
      .andThen((cart) => {
        if (!cart) {
          return ResultAsync.fromPromise(
            Promise.reject(new Error('Cart not found')),
            (): UpdateCartItemError => ({
              type: errTypes.CART_NOT_FOUND,
              message: 'Cart not found for user',
            }),
          );
        }
        return ok(cart);
      })
      .andThen((cart) => {
        return ResultAsync.fromPromise(
          this.repo.findCartProduct(cart.id, itemId),
          (): RemoveItemFromCartError => ({
            type: errTypes.CART_ITEM_NOT_FOUND,
            message: 'Cart item not found',
          }),
        ).map((existingCartProduct) => ({ cart, existingCartProduct }));
      })
      .andThen(({ cart, existingCartProduct }) => {
        if (!existingCartProduct) {
          return ResultAsync.fromPromise(
            Promise.reject(new Error('Cart item not found')),
            (): RemoveItemFromCartError => ({
              type: errTypes.CART_ITEM_NOT_FOUND,
              message: 'Cart item not found',
            }),
          );
        }

        return ResultAsync.fromPromise(
          this.repo.removeCartProduct(cart.id, existingCartProduct.productId),
          (): RemoveItemFromCartError => ({
            type: errTypes.CART_ITEM_NOT_FOUND,
            message: 'Failed to remove cart item',
          }),
        ).map(() => ({ cartId: cart.id }));
      })
      .andThen(({ cartId }) => {
        return ResultAsync.fromPromise(
          this.repo.getCartById(cartId),
          (): RemoveItemFromCartError => ({
            type: errTypes.CART_NOT_FOUND,
            message: 'Unable to find cart after item update',
          }),
        );
      })
      .map((updatedCart) => {
        if (!updatedCart) {
          throw new BadRequestException('Cart not found after update');
        }

        return {
          ...updatedCart,
          products: updatedCart.products.map(
            (cartProduct) => cartProduct.product,
          ),
        };
      });
  }

  async deleteUserCart(
    userId: number
  ): Promise<void> {
    return await this.repo.deleteUserCart(userId)
  }
}
