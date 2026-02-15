import { PrismaService } from '@app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CategoriesListDto } from './dtos/categoriesList.dto';
import { ProductEntity } from '@app/shared/entities/product.entity';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CategoriesListDto> {
    const categories = await this.prisma.category.findMany();
    return { categories };
  }

  async findProductsByCategoryId(categoryId: number): Promise<ProductEntity[]> {
    const categoryProducts = await this.prisma.categoryProduct.findMany({
      where: { categoryId },
      include: { product: true },
    });

    return categoryProducts.map((cp) => cp.product);
  }
}
