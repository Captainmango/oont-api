import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma/prisma.module';
import { CategoriesContoller } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesContoller],
  providers: [CategoriesService, CategoriesRepository],
})
export class CategoryModule {}
