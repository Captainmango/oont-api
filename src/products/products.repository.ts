import { PrismaService } from '@app/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ProductsListDto } from './dtos/productsList.dto';
import { ProductEntity } from './product.entity';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts(page: number, pageSize: number): Promise<ProductsListDto> {
    const products = await this.prisma.product.findMany({
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return { products };
  }

  async getProductById(id: number): Promise<ProductEntity | null> {
    return await this.prisma.product.findUnique({
      where: { id },
    });
  }
}
