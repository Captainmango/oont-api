import { Injectable } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { ProductsListDto } from './dtos/productsList.dto';
import { ProductEntity } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  async getAll(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<ProductsListDto> {
    return await this.repo.getProducts(page, pageSize);
  }

  async getById(id: number): Promise<ProductEntity | null> {
    return await this.repo.getProductById(id);
  }
}
