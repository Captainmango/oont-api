import { Category } from '@gen-prisma/client';

export const categoryList: Array<
  Omit<Category, 'id' | 'created_at' | 'updated_at'>
> = [
  {
    name: 'Electronics',
  },
  {
    name: 'Audio',
  },
  {
    name: 'Sports',
  },
  {
    name: 'Footwear',
  },
  {
    name: 'Kitchen',
  },
  {
    name: 'Appliances',
  },
  {
    name: 'Computers',
  },
  {
    name: 'Fitness',
  },
];
