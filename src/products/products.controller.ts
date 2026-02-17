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
import { ProductEntity } from '@app/shared/entities/product.entity';
import { errTypes } from './errors';
import { PaginationQueryDto } from '@app/shared/dtos/paginationQuery.dto';

@ApiTags('products')
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts(
    @Query(new ValidationPipe({ transform: true })) query: PaginationQueryDto,
  ): Promise<ProductsListDto> {
    const result = await this.productsService.getAll(
      query.page,
      query.pageSize,
    );

    return result.match(
      (ok) => ok,
      (err) => {
        switch (err.type) {
          case errTypes.PRODUCTS_NOT_FOUND:
          case errTypes.PRODUCT_NOT_FOUND:
            throw new NotFoundException(err);
          default:
            throw new InternalServerErrorException(err);
        }
      },
    );
  }

  @Get('/:id')
  async getProductById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductEntity | null> {
    const result = await this.productsService.getById(id);

    return result.match(
      (ok) => ok,
      (err) => {
        switch (err.type) {
          case errTypes.PRODUCTS_NOT_FOUND:
          case errTypes.PRODUCT_NOT_FOUND:
            throw new NotFoundException(err);
          default:
            throw new InternalServerErrorException(err);
        }
      },
    );
  }
}
