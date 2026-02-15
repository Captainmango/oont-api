import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { ProductsListDto } from '@app/shared/dtos/productsList.dto';
import { ProductEntity } from '@app/shared/entities/product.entity';
import { ResultAsync } from 'neverthrow';
import { ProductError, errTypes } from './errors';

@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  getAll(
    page: number = 1,
    pageSize: number = 10,
  ): ResultAsync<ProductsListDto, ProductError> {
    return ResultAsync.fromPromise(
      this.repo.getProducts(page, pageSize),
      (): ProductError => ({
        type: errTypes.PRODUCTS_NOT_FOUND,
        message: 'Failed to retrieve products',
      }),
    );
  }

  getById(id: number): ResultAsync<ProductEntity | null, ProductError> {
    return ResultAsync.fromPromise(
      this.repo.getProductById(id),
      (): ProductError => ({
        type: errTypes.PRODUCT_NOT_FOUND,
        message: 'Failed to retrieve product',
      }),
    );
  }
}
