import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor(identifier: number | string) {
    super(
      `User with ${typeof identifier === 'number' ? 'ID' : 'email'} ${identifier} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateUserException extends HttpException {
  constructor(email: string) {
    super(`User with email ${email} already exists`, HttpStatus.CONFLICT);
  }
}
