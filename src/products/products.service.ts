import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { ProductsListDto } from '@app/shared/dtos/productsList.dto';
import { ProductEntity } from '@app/shared/entities/product.entity';
import { ResultAsync } from 'neverthrow';
import { GetAllProductsError, GetProductByIdError, errTypes } from './errors';

@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  getAll(
    page: number = 1,
    pageSize: number = 10,
  ): ResultAsync<ProductsListDto, GetAllProductsError> {
    return ResultAsync.fromPromise(
      this.repo.getProducts(page, pageSize),
      (): GetAllProductsError => ({
        type: errTypes.PRODUCTS_NOT_FOUND,
        message: 'Failed to retrieve products',
      }),
    );
  }

  getById(id: number): ResultAsync<ProductEntity | null, GetProductByIdError> {
    return ResultAsync.fromPromise(
      this.repo.getProductById(id),
      (): GetProductByIdError => ({
        type: errTypes.PRODUCT_NOT_FOUND,
        message: 'Failed to retrieve product',
      }),
    );
  }
}
