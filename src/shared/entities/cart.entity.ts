import { Cart } from '@gen-prisma/client';
import { ProductEntity } from './product.entity';

export class CartEntity implements Cart {
  id: number;
  products: ProductEntity[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
