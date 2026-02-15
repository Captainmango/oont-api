import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CategoriesListDto } from './dtos/categoriesList.dto';
import { ProductsListDto } from '@app/shared/dtos/productsList.dto';
import { ResultAsync } from 'neverthrow';
import {
  GetAllCategoriesError,
  GetProductsByCategoryError,
  errTypes,
} from './errors';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  getAll(): ResultAsync<CategoriesListDto, GetAllCategoriesError> {
    return ResultAsync.fromPromise(
      this.repo.findAll(),
      (): GetAllCategoriesError => ({
        type: errTypes.CATEGORIES_NOT_FOUND,
        message: 'Failed to retrieve categories',
      }),
    );
  }

  getAllProductsByCategoryId(
    categoryId: number,
  ): ResultAsync<ProductsListDto, GetProductsByCategoryError> {
    return ResultAsync.fromPromise(
      this.repo.findProductsByCategoryId(categoryId),
      (): GetProductsByCategoryError => ({
        type: errTypes.PRODUCTS_NOT_FOUND,
        message: 'Failed to retrieve products for category',
      }),
    ).map((products) => ({ products }));
  }
}
