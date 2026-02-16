import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
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
import { ValidateUserExistsPipe } from '@app/users/pipes/validate-user-exists.pipe';

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
    @Param('userId', new ParseIntPipe(), ValidateUserExistsPipe) userId: number,
  ): Promise<CartEntity | null> {
    const result = await this.cartsService.getUserCart(userId);

    return result.match(
      (ok) => ok,
      (err) => {
        switch (err.type) {
          case errTypes.CART_NOT_FOUND:
            throw new NotFoundException(err);
          default:
            throw new InternalServerErrorException(err);
        }
      },
    );
  }

  @Post('/:userId/items')
  @HttpCode(HttpStatus.OK)
  async addItemToCart(
    @Param('userId', new ParseIntPipe(), ValidateUserExistsPipe) userId: number,
    @Body() addItemToCartDto: AddItemToCartDto,
  ): Promise<CartEntity> {
    const result = await this.cartsService.addItemToCart(
      userId,
      addItemToCartDto.productId,
      addItemToCartDto.quantity,
    );

    return result.match(
      (ok) => ok,
      (err) => {
        switch (err.type) {
          case errTypes.CART_ITEM_NOT_FOUND:
          case errTypes.CART_NOT_FOUND:
          case errTypes.PRODUCT_NOT_FOUND:
            throw new NotFoundException(err);
          case errTypes.PRODUCT_ADD_FAILED:
          case errTypes.PRODUCT_UPDATE_FAILED:
          case errTypes.INSUFFICIENT_STOCK:
            throw new ConflictException(err);
          case errTypes.CART_ITEM_NOT_DELETED:
          case errTypes.CART_NOT_DELETED:
          default:
            throw new InternalServerErrorException(err);
        }
      },
    );
  }

  @Put('/:userId/items/:itemId')
  @HttpCode(HttpStatus.OK)
  async updateCartItem(
    @Param('userId', new ParseIntPipe(), ValidateUserExistsPipe) userId: number,
    @Param('itemId', new ParseIntPipe()) itemId: number,
    @Body() updateCartItemsDto: UpdateCartItemDto,
  ): Promise<CartEntity> {
    const result = await this.cartsService.updateCartItem(
      userId,
      itemId,
      updateCartItemsDto.quantity,
    );

    return result.match(
      (ok) => ok,
      (err) => {
        switch (err.type) {
          case errTypes.CART_ITEM_NOT_FOUND:
          case errTypes.CART_NOT_FOUND:
          case errTypes.PRODUCT_NOT_FOUND:
            throw new NotFoundException(err);
          case errTypes.PRODUCT_ADD_FAILED:
          case errTypes.PRODUCT_UPDATE_FAILED:
          case errTypes.INSUFFICIENT_STOCK:
            throw new ConflictException(err);
          case errTypes.CART_ITEM_NOT_DELETED:
          case errTypes.CART_NOT_DELETED:
          default:
            throw new InternalServerErrorException(err);
        }
      },
    );
  }

  @Delete('/:userId/items/:itemId')
  @HttpCode(HttpStatus.OK)
  async removeItemFromCart(
    @Param('userId', new ParseIntPipe(), ValidateUserExistsPipe) userId: number,
    @Param('itemId', new ParseIntPipe()) itemId: number,
  ): Promise<CartEntity> {
    const result = await this.cartsService.removeItemFromCart(userId, itemId);

    return result.match(
      (ok) => ok,
      (err) => {
        switch (err.type) {
          case errTypes.CART_ITEM_NOT_FOUND:
          case errTypes.CART_NOT_FOUND:
          case errTypes.PRODUCT_NOT_FOUND:
            throw new NotFoundException(err);
          case errTypes.PRODUCT_ADD_FAILED:
          case errTypes.PRODUCT_UPDATE_FAILED:
            throw new ConflictException(err);
          case errTypes.CART_ITEM_NOT_DELETED:
          case errTypes.CART_NOT_DELETED:
          default:
            throw new InternalServerErrorException(err);
        }
      },
    );
  }

  @Delete('/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCart(
    @Param('userId', new ParseIntPipe(), ValidateUserExistsPipe) userId: number,
  ): Promise<void> {
    const result = await this.cartsService.deleteUserCart(userId);

    return result.match(
      (ok) => ok,
      (err) => {
        switch (err.type) {
          case errTypes.CART_ITEM_NOT_FOUND:
          case errTypes.CART_NOT_FOUND:
          case errTypes.PRODUCT_NOT_FOUND:
            throw new NotFoundException(err);
          case errTypes.PRODUCT_ADD_FAILED:
          case errTypes.PRODUCT_UPDATE_FAILED:
            throw new ConflictException(err);
          case errTypes.CART_ITEM_NOT_DELETED:
          case errTypes.CART_NOT_DELETED:
          default:
            throw new InternalServerErrorException(err);
        }
      },
    );
  }
}
