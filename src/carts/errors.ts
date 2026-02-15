import { errorType } from '@app/shared/errorType';

export const errTypes = {
  CART_NOT_FOUND: 'CART_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
  CART_NOT_DELETED: 'CART_NOT_DELETED',
} as const;

export type CartError =
  | AddItemToCartError
  | UpdateCartItemError
  | RemoveItemFromCartError
  | FindCartError
  | DeleteCartError;

export interface AddItemToCartError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

export interface UpdateCartItemError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

export interface RemoveItemFromCartError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

export interface FindCartError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

export interface DeleteCartError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}
