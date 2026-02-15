import { errorType } from '@app/shared/errorType';


export type CategoryError =
  | GetAllCategoriesError
  | GetProductsByCategoryError

export const errTypes = {
  CATEGORIES_NOT_FOUND: 'CATEGORIES_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
} as const;

interface GetAllCategoriesError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}

interface GetProductsByCategoryError extends errorType {
  type: keyof typeof errTypes;
  message: string;
}
