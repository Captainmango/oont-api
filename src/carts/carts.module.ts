import { PrismaModule } from '@app/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { CartsRepository } from './carts.repository';
import { UsersModule } from '@app/users/users.module';
import { ValidateUserExistsPipe } from '@app/users/pipes/validate-user-exists.pipe';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CartsController],
  providers: [CartsService, CartsRepository, ValidateUserExistsPipe],
  exports: [CartsService],
})
export class CartsModule {}
