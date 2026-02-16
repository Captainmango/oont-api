import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Body,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderEntity } from '@app/shared/entities/order.entity';
import { errTypes, OrderError } from './errors';
import { CreateOrderInputDto } from './dtos/createOrderInput.dto';

@Controller({
  path: 'orders',
  version: '1',
})
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async placeOrder(
    @Body() createOrderDto: CreateOrderInputDto,
  ): Promise<OrderEntity> {
    const result = await this.ordersService.placeOrder(createOrderDto.userId);

    return result.match(
      (ok) => ok,
      (error: OrderError) => {
        switch (error.type) {
          case errTypes.CART_NOT_FOUND:
            throw new NotFoundException(error);
          case errTypes.CART_EMPTY:
            throw new ConflictException(error);
          case errTypes.ORDER_CREATION_FAILED:
          case errTypes.INSUFFICIENT_STOCK:
            throw new ConflictException(error);
          default:
            throw new InternalServerErrorException(error);
        }
      },
    );
  }
}
