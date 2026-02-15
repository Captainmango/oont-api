import { ErrorType } from '@app/shared/errorType';

export const errTypes = {
  CATEGORIES_NOT_FOUND: 'CATEGORIES_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  PRODUCTS_NOT_FOUND: 'PRODUCTS_NOT_FOUND',
} as const;

export interface CategoryError extends ErrorType {
  type: keyof typeof errTypes;
}
