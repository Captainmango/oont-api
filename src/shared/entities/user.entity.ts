import { User } from '@gen-prisma/client';

export class UserEntity implements User {
  name: string;
  id: number;
  email: string;
  created_at: Date;
  updated_at: Date;
}
