import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoriesListDto } from './dtos/categoriesList.dto';
import { ProductsListDto } from '@app/shared/dtos/productsList.dto';
import { errTypes } from './errors';

@ApiTags('categories')
@Controller({
  path: 'categories',
  version: '1',
})
export class CategoriesContoller {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAllCategories(): Promise<CategoriesListDto> {
    const result = await this.categoriesService.getAll();

    return result.match(
      (ok) => ok,
      (err) => {
        switch (err.type) {
          case errTypes.CATEGORIES_NOT_FOUND:
          case errTypes.CATEGORY_NOT_FOUND:
          case errTypes.PRODUCTS_NOT_FOUND:
            throw new NotFoundException(err);
          default:
            throw new InternalServerErrorException(err);
        }
      },
    );
  }

  @Get('/:id/products')
  async getAllProductsByCategory(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<ProductsListDto> {
    const result = await this.categoriesService.getAllProductsByCategoryId(id);

    return result.match(
      (ok) => ok,
      (err) => {
        switch (err.type) {
          case errTypes.CATEGORIES_NOT_FOUND:
          case errTypes.CATEGORY_NOT_FOUND:
          case errTypes.PRODUCTS_NOT_FOUND:
            throw new NotFoundException(err);
          default:
            throw new InternalServerErrorException(err);
        }
      },
    );
  }
}
