import { HttpException, HttpStatus } from '@nestjs/common';

export class ChatSessionNotFoundException extends HttpException {
  constructor(id: number) {
    super(`Chat session with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}
