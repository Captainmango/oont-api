import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users.repository';
import { UserNotFoundError } from '../errors';

@Injectable()
export class ValidateUserExistsPipe implements PipeTransform {
  constructor(private readonly usersRepository: UsersRepository) {}

  async transform(userId: number): Promise<number> {
    const exists = await this.usersRepository.userExists(userId);

    if (!exists) {
      throw new NotFoundException(new UserNotFoundError(userId));
    }

    return userId;
  }
}
