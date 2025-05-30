import { HttpException, HttpStatus } from '@nestjs/common';

export class GoalNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Goal with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class GoalNotOwnerException extends HttpException {
  constructor(id: number) {
    super(`You are not the owner of goal with ID ${id}`, HttpStatus.FORBIDDEN);
  }
}

export class InvalidGoalProgressException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
} 
