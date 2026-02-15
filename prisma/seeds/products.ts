import { Product } from '@gen-prisma/client';

export const productList: Array<
  Omit<Product, 'id' | 'created_at' | 'updated_at'>
> = [
  {
    name: 'Wireless Headphones',
    quantity: 100,
  },
  {
    name: 'Running Shoes',
    quantity: 50,
  },
  {
    name: 'Coffee Maker',
    quantity: 25,
  },
  {
    name: 'Laptop',
    quantity: 30,
  },
  {
    name: 'Yoga Mat',
    quantity: 75,
  },
];
