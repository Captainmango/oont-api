import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ValidateUserExistsPipe } from './validate-user-exists.pipe';
import { PrismaService } from '@app/prisma/prisma.service';
import { PrismaModule } from '@app/prisma/prisma.module';
import { UsersModule } from '../users.module';

describe('ValidateUserExistsPipe', () => {
  let pipe: ValidateUserExistsPipe;
  let prismaService: PrismaService;
  let module: TestingModule;
  let testUser: { id: number; name: string; email: string } | null = null;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule, UsersModule],
    }).compile();

    pipe = module.get<ValidateUserExistsPipe>(ValidateUserExistsPipe);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
    await prismaService.$disconnect();
  });

  afterEach(async () => {
    if (testUser) {
      await prismaService.user
        .delete({ where: { id: testUser.id } })
        .catch(() => {});
      testUser = null;
    }
  });

  describe('happy path', () => {
    it('should return the userId when the user exists', async () => {
      testUser = await prismaService.user.create({
        data: {
          name: 'Test User',
          email: `test-user-exists-${Date.now()}@example.com`,
        },
      });

      const result = await pipe.transform(testUser.id);

      expect(result).toBe(testUser.id);
    });
  });

  describe('unhappy path', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      const nonExistentUserId = 99999999;

      await expect(pipe.transform(nonExistentUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
