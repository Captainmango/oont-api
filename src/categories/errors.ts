import { errorType } from '@app/shared/errorType';

export const errTypes = {
  CATEGORIES_NOT_FOUND: 'CATEGORIES_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
} as const;

export interface GetAllCategoriesError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

export interface GetProductsByCategoryError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}
