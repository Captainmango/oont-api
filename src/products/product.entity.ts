import { Product } from '@gen-prisma/client';

export class ProductEntity implements Product {
  id: number;
  name: string;
  quantity: number;
  categories?: string[];
  created_at: Date;
  updated_at: Date;
}
