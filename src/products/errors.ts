import { ErrorType } from '@app/shared/errorType';

export const errTypes = {
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
} as const;

export interface ProductError extends ErrorType {
  type: keyof typeof errTypes;
}
