import { HttpException, HttpStatus } from '@nestjs/common';

export class UserFeedbackNotFoundException extends HttpException {
  constructor(id: number) {
    super(`User feedback with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
