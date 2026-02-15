import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoriesListDto } from './dtos/categoriesList.dto';
import { ProductsListDto } from '@app/shared/dtos/productsList.dto';

@ApiTags('categories')
@Controller({
  path: 'categories',
  version: '1',
})
export class CategoriesContoller {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAllCategories(): Promise<CategoriesListDto> {
    return await this.categoriesService.getAll();
  }

  @Get('/:id/products')
  async getAllProductsByCategory(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<ProductsListDto> {
    return await this.categoriesService.getAllProductsByCategoryId(id);
  }
}
