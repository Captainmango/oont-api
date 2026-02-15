import { ProductEntity } from '@app/shared/entities/product.entity';

export class CartWithCartProducts {
  id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  products: Array<{
    product: ProductEntity;
  }>;
}
