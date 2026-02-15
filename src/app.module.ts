import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma/prisma.module';
import { ProductModule } from '@app/products/products.module';
import { CategoryModule } from './categories/categories.module';
import { CartsModule } from './carts/carts.module';

@Module({
  imports: [PrismaModule, ProductModule, CategoryModule, CartsModule],
})
export class AppModule {}
