import { PrismaService } from '@app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CategoriesListDto } from '../shared/dtos/categoriesList.dto';
import { ProductEntity } from '@app/shared/entities/product.entity';
import { ProductsListDto } from '@app/shared/dtos/productsList.dto';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page: number,
    pageSize: number
  ): Promise<CategoriesListDto> {
    const [categories, count] = await Promise.all([
      this.prisma.category.findMany({
        take: pageSize,
        skip: (page - 1) * pageSize
      }),
      this.prisma.category.count()
    ])

    return { 
      categories,
      meta: {
        pagination: {page, pageSize, count}
      }
    };
  }

  async findProductsByCategoryId(
    categoryId: number,
    page: number,
    pageSize: number
  ): Promise<ProductsListDto> {
    const [categoryProducts, count] = await Promise.all([
      this.prisma.categoryProduct.findMany({
        where: { categoryId },
        include: { product: true },
        take: pageSize,
        skip: (page - 1) * pageSize
      }),
      this.prisma.categoryProduct.count()
    ])

    const products = categoryProducts.map((cp) => cp.product)

    return {
      products,
      meta: {
        pagination: {page, pageSize, count}
      }
    };
  }
}
