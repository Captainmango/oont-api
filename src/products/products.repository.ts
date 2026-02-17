import { PrismaService } from '@app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ProductsListDto } from '@app/shared/dtos/productsList.dto';
import { ProductEntity } from '@app/shared/entities/product.entity';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(page: number, pageSize: number): Promise<ProductsListDto> {
    const [products, count] = await Promise.all([
      this.prisma.product.findMany({
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.product.count()
    ])

    return { 
      products,
      meta: {
        pagination: { page, pageSize, count}
      }
    };
  }

  async getProductById(id: number): Promise<ProductEntity | null> {
    return await this.prisma.product.findUnique({
      where: { id },
    });
  }
}
