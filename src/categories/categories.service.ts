import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CategoriesListDto } from './dtos/categoriesList.dto';
import { ProductsListDto } from '@app/products/dtos/productsList.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  async getAll(): Promise<CategoriesListDto> {
    return await this.repo.findAll();
  }

  async getAllProductsByCategoryId(
    categoryId: number,
  ): Promise<ProductsListDto> {
    const products = await this.repo.findProductsByCategoryId(categoryId);
    return { products };
  }
}
