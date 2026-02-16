import { ProductEntity } from '@app/shared/entities/product.entity';
import { OrderStatus } from '@gen-prisma/enums';

export class OrderWithProducts {
  id: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  products: Array<{
    product: ProductEntity;
  }>;
}
