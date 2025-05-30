import { HttpException, HttpStatus } from '@nestjs/common';

export class InvoiceNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Invoice with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InvoiceNotOwnerException extends HttpException {
  constructor(id: number) {
    super(
      `You are not the owner of invoice with ID ${id}`,
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvoiceAlreadyPaidException extends HttpException {
  constructor(id: number) {
    super(`Invoice with ID ${id} is already paid`, HttpStatus.BAD_REQUEST);
  }
}

export class InvoiceClosingDateException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
