import { errorType } from '@app/shared/errorType';

export const errTypes = {
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
} as const;

export interface GetAllProductsError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

export interface GetProductByIdError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}
