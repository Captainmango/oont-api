import { errorType } from '@app/shared/errorType';


export type ProductError = 
  | GetAllProductsError
  | GetProductByIdError

export const errTypes = {
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
} as const;

interface GetAllProductsError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

interface GetProductByIdError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}
