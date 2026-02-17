import { PaginationDto } from '@app/shared/dtos/pagination.dto';
import { CategoryEntity } from '@app/shared/entities/category.entity';

export class CategoriesListDto {
  categories: CategoryEntity[];
  meta: {
    pagination: PaginationDto
  }
}
