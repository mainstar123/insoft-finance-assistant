import { HttpException, HttpStatus } from '@nestjs/common';

export class UserConsentNotFoundException extends HttpException {
  constructor(id: number) {
    super(`User consent with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
