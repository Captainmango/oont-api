import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { CartEntity } from '@app/shared/entities/cart.entity';
import { AddItemToCartDto } from './dtos/addItemToCart.dto';

@ApiTags('carts')
@Controller({
  path: 'carts',
  version: '1',
})
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('/:userId')
  async getUserCart(
    @Param('userId', new ParseIntPipe()) userId: number,
  ): Promise<CartEntity | null> {
    return this.cartsService.getUserCart(userId);
  }

  @Post('/:userId/items/:itemId')
  async addItemToCart(
    @Param('userId', new ParseIntPipe()) userId: number,
    @Param('itemId', new ParseIntPipe()) itemId: number,
    @Body() addItemToCartDto: AddItemToCartDto,
  ): Promise<CartEntity> {
    const result = await this.cartsService.addItemToCart(
      userId,
      itemId,
      addItemToCartDto.quantity,
    );

    if (result.isErr()) {
      const error = result.error;
      if (
        error.type === 'CART_NOT_FOUND' ||
        error.type === 'PRODUCT_NOT_FOUND'
      ) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    return result.value;
  }
}
