import { ErrorType } from '@app/shared/errorType';

export const errTypes = {
  FAILED_TO_CREATE_CART: 'FAILED_TO_CREATE_CART',
  CART_NOT_FOUND: 'CART_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_UPDATE_FAILED: 'PRODUCT_UPDATE_FAILED',
  PRODUCT_ADD_FAILED: 'PRODUCT_ADD_FAILED',
  CART_ITEM_NOT_FOUND: 'CART_ITEM_NOT_FOUND',
  CART_ITEM_NOT_DELETED: 'CART_ITEM_NOT_DELETED',
  CART_NOT_DELETED: 'CART_NOT_DELETED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
} as const;

export interface CartError extends ErrorType {
  type: keyof typeof errTypes;
}

export class InsufficientStockError extends Error {
  constructor(
    public readonly productId: number,
    public readonly requestedQuantity: number,
    public readonly availableStock: number,
  ) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requestedQuantity}, Available: ${availableStock}`,
    );
    this.name = 'InsufficientStockError';
  }
}

export class CartNotFoundError extends Error {
  type: keyof typeof errTypes
  constructor(){
    super('Cart not found.')
    this.name = 'CartNotFoundError'
    this.type = errTypes.CART_NOT_FOUND
  }
}
