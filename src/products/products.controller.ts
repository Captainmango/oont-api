import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiTags } from '@nestjs/swagger';
import { ProductsListDto } from '@app/shared/dtos/productsList.dto';
import { GetAllProductsDto } from './dtos/getAllProducts.dto';
import { ProductEntity } from '@app/shared/entities/product.entity';
import { errTypes } from './errors';

@ApiTags('products')
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts(
    @Query(new ValidationPipe({ transform: true })) query: GetAllProductsDto,
  ): Promise<ProductsListDto> {
    const result = await this.productsService.getAll(
      query.page,
      query.pageSize,
    );

    if (result.isErr()) {
      const error = result.error;
      throw new NotFoundException(error);
    }

    return result.value;
  }

  @Get('/:id')
  async getProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductEntity | null> {
    const result = await this.productsService.getById(id);

    if (result.isErr()) {
      const error = result.error
      switch (error.type) {
        case errTypes.PRODUCT_NOT_FOUND:
        case errTypes.PRODUCTS_NOT_FOUND:
          throw new NotFoundException(error);
        default:
          throw new InternalServerErrorException(error)
      }
    }

    return result.value;
  }
}
