import { User } from "@gen-prisma/client";

export const usersList: Array<
  Omit<User, 'id' | 'created_at' | 'updated_at'>
> = [
    {
      name: 'Test User #1',
      email: "test123@test123.com",
    },
    {
      name: 'Test User #2',
      email: "test456@test456.com",
    }
]