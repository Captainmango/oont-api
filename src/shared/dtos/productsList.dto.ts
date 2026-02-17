import { ProductEntity } from '../entities/product.entity';
import { PaginationDto } from './pagination.dto';

export class ProductsListDto {
  products: ProductEntity[];
  meta: {
    pagination: PaginationDto
  }
}
