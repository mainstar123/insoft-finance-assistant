import { HttpException, HttpStatus } from '@nestjs/common';

export class CategoryNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Category with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class CategoryNotOwnerException extends HttpException {
  constructor(id: number) {
    super(
      `You are not the owner of category with ID ${id}`,
      HttpStatus.FORBIDDEN,
    );
  }
}
