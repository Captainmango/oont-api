import { Controller, Get, HttpCode, UnprocessableEntityException } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { User, Prisma } from '@gen-prisma/client';
import { ok, okAsync, ResultAsync } from 'neverthrow';
import { response } from 'express';

@Controller({
  version: "1"
})
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/test')
  @HttpCode(201)
  async testEndpoint() {
    const data: Prisma.UserCreateInput = {
      email: 'test@test.com',
      name: 'Edward',
    };

    const result = await ResultAsync.fromPromise(this.prisma.user.create({ data }), () => new Error('failed to add user'));

    if (result.isErr()) {
      throw new UnprocessableEntityException("Thing broke", {
        cause: result.error,
        description: "Email already taken"
      })
    }

    return result.value
  }
}
