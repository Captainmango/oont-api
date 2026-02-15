import {
  BadRequestException,
  Controller,
  Get,
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

    if (result.isErr()) {
      const error = result.error;
      throw new BadRequestException(error.message);
    }

    return result.value;
  }

  @Get('/:id/products')
  async getAllProductsByCategory(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<ProductsListDto> {
    const result = await this.categoriesService.getAllProductsByCategoryId(id);

    if (result.isErr()) {
      const error = result.error;
      throw new BadRequestException(error.message);
    }

    return result.value;
  }
}
