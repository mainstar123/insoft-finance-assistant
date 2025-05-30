import { HttpException, HttpStatus } from '@nestjs/common';

export class TransactionNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Transaction with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class TransactionNotOwnerException extends HttpException {
  constructor(id: number) {
    super(`You are not the owner of transaction with ID ${id}`, HttpStatus.FORBIDDEN);
  }
}

export class TransactionNotPaidException extends HttpException {
  constructor(id: number) {
    super(`Transaction with ID ${id} is not paid`, HttpStatus.BAD_REQUEST);
  }
}

export class TransactionNotArchivedException extends HttpException {
  constructor(id: number) {
    super(`Transaction with ID ${id} is not archived`, HttpStatus.BAD_REQUEST);
  }
}


