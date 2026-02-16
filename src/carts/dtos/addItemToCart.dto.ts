import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AddItemToCartDto {
  @ApiProperty({
    type: Number,
    example: 1,
    description: 'ID of the product to add',
  })
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Quantity of the item to add',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
