import { ProductEntity } from './product.entity';
import { Order, OrderStatus } from '@gen-prisma/browser';

export class OrderEntity implements Order {
  id: number;
  status: OrderStatus;
  products: ProductEntity[];
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
