import { ErrorType } from '@app/shared/errorType';

export const errTypes = {
  CART_NOT_FOUND: 'CART_NOT_FOUND',
  CART_EMPTY: 'CART_EMPTY',
  ORDER_CREATION_FAILED: 'ORDER_CREATION_FAILED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
} as const;

export interface OrderError extends ErrorType {
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
