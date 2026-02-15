import {
  BadRequestException,
  Controller,
  Get,
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
      throw new BadRequestException(error.message);
    }

    return result.value;
  }

  @Get('/:id')
  async getProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductEntity | null> {
    const result = await this.productsService.getById(id);

    if (result.isErr()) {
      const error = result.error;
      throw new BadRequestException(error.message);
    }

    return result.value;
  }
}
