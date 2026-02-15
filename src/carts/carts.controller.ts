import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { CartEntity } from '@app/shared/entities/cart.entity';
import { AddItemToCartDto } from './dtos/addItemToCart.dto';
import { errTypes } from './errors';
import { UpdateCartItemDto } from './dtos/updateCartItem.dto';

@ApiTags('carts')
@Controller({
  path: 'carts',
  version: '1',
})
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('/:userId')
  @HttpCode(HttpStatus.OK)
  async getUserCart(
    @Param('userId', new ParseIntPipe()) userId: number,
  ): Promise<CartEntity | null> {
    const result = await this.cartsService.getUserCart(userId);

    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }

  @Post('/:userId/items')
  @HttpCode(HttpStatus.OK)
  async addItemToCart(
    @Param('userId', new ParseIntPipe()) userId: number,
    @Body() addItemToCartDto: AddItemToCartDto,
  ): Promise<CartEntity> {
    const result = await this.cartsService.addItemToCart(
      userId,
      addItemToCartDto.productId,
      addItemToCartDto.quantity,
    );

    if (result.isErr()) {
      const error = result.error;
      if (
        error.type === errTypes.CART_NOT_FOUND ||
        error.type === errTypes.PRODUCT_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    return result.value;
  }

  @Put('/:userId/items/:itemId')
  @HttpCode(HttpStatus.OK)
  async updateCartItem(
    @Param('userId', new ParseIntPipe()) userId: number,
    @Param('itemId', new ParseIntPipe()) itemId: number,
    @Body() updateCartItemsDto: UpdateCartItemDto,
  ): Promise<CartEntity> {
    const result = await this.cartsService.updateCartItem(
      userId,
      itemId,
      updateCartItemsDto.quantity,
    );

    if (result.isErr()) {
      const error = result.error;
      if (
        error.type === errTypes.CART_NOT_FOUND ||
        error.type === errTypes.CART_ITEM_NOT_FOUND ||
        error.type === errTypes.PRODUCT_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    return result.value;
  }

  @Delete('/:userId/items/:itemId')
  @HttpCode(HttpStatus.OK)
  async removeItemFromCart(
    @Param('userId', new ParseIntPipe()) userId: number,
    @Param('itemId', new ParseIntPipe()) itemId: number,
  ) {
    const result = await this.cartsService.removeItemFromCart(userId, itemId);

    if (result.isErr()) {
      const error = result.error;
      if (
        error.type === errTypes.CART_NOT_FOUND ||
        error.type === errTypes.CART_ITEM_NOT_FOUND ||
        error.type === errTypes.PRODUCT_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    return result.value;
  }

  @Delete('/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCart(
    @Param('userId', new ParseIntPipe()) userId: number,
  ): Promise<void> {
    const result = await this.cartsService.deleteUserCart(userId);

    if (result.isErr()) {
      const error = result.error;
      if (
        error.type === errTypes.CART_NOT_FOUND ||
        error.type === errTypes.CART_ITEM_NOT_FOUND ||
        error.type === errTypes.PRODUCT_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}
