import { ErrorType } from '@app/shared/errorType';

export const errTypes = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EXISTS_CHECK_FAILED: 'USER_EXISTS_CHECK_FAILED',
} as const;

export interface UserError extends ErrorType {
  type: keyof typeof errTypes;
}

export class UserNotFoundError extends Error {
  constructor(public readonly userId: number) {
    super(`User with id ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}
