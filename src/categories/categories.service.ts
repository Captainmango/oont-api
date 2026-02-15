import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CategoriesListDto } from './dtos/categoriesList.dto';
import { ProductsListDto } from '@app/shared/dtos/productsList.dto';
import { ResultAsync } from 'neverthrow';
import {
  CategoryError,
  errTypes,
} from './errors';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  getAll(): ResultAsync<CategoriesListDto, CategoryError> {
    return ResultAsync.fromPromise(
      this.repo.findAll(),
      (): CategoryError => ({
        type: errTypes.CATEGORIES_NOT_FOUND,
        message: 'Failed to retrieve categories',
      }),
    );
  }

  getAllProductsByCategoryId(
    categoryId: number,
  ): ResultAsync<ProductsListDto, CategoryError> {
    return ResultAsync.fromPromise(
      this.repo.findProductsByCategoryId(categoryId),
      (): CategoryError => ({
        type: errTypes.PRODUCTS_NOT_FOUND,
        message: 'Failed to retrieve products for category',
      }),
    ).map((products) => ({ products }));
  }
}
