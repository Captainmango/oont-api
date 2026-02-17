import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateOrderInputDto {
  @ApiProperty({ 
    type: Number,
    example: 10, 
    required: true ,
    description: 'The user to create the order for. Order created from items currently in the cart.'
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userId: number;
}
