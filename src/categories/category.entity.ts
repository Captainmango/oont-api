import { Category } from '@gen-prisma/client';

export class CategoryEntity implements Category {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}
