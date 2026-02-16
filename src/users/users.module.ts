import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma/prisma.module';
import { UsersRepository } from './users.repository';
import { ValidateUserExistsPipe } from './pipes/validate-user-exists.pipe';

@Module({
  imports: [PrismaModule],
  providers: [UsersRepository, ValidateUserExistsPipe],
  exports: [UsersRepository, ValidateUserExistsPipe],
})
export class UsersModule {}
