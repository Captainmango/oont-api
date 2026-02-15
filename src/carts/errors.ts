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

interface AddItemToCartError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

interface UpdateCartItemError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

interface RemoveItemFromCartError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

interface FindCartError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

interface DeleteCartError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}
