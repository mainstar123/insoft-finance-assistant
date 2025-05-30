import { HttpException, HttpStatus } from '@nestjs/common';

export class BudgetNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Budget with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class BudgetNotOwnerException extends HttpException {
  constructor(id: number) {
    super(
      `You are not the owner of budget with ID ${id}`,
      HttpStatus.FORBIDDEN,
    );
  }
}

export class DuplicateBudgetException extends HttpException {
  constructor(name: string) {
    super(
      `Budget with name ${name} already exists for this period`,
      HttpStatus.CONFLICT,
    );
  }
}
