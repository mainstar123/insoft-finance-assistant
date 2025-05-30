import { HttpException, HttpStatus } from '@nestjs/common';

export class AccountNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Account with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class DuplicateAccountException extends HttpException {
  constructor(name: string) {
    super(`Account with name ${name} already exists`, HttpStatus.CONFLICT);
  }
}
