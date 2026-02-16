import { PrismaModule } from '@app/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { CartsModule } from '@app/carts/carts.module';
import { OrdersController } from './orders.controller';
import { CartsRepository } from '@app/carts/carts.repository';

@Module({
  imports: [PrismaModule, CartsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, CartsRepository],
})
export class OrdersModule {}
