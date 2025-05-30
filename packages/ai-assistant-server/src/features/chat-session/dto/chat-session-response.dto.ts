import { ApiProperty } from '@nestjs/swagger';
import { IChatMessage } from '../interfaces/chat-session.interface';

export class ChatMessageResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  sessionId!: number;

  @ApiProperty()
  sender!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  timestamp!: Date;

  constructor(partial: Partial<ChatMessageResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ChatSessionResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  startedAt!: Date;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [ChatMessageResponseDto], required: false })
  messages?: ChatMessageResponseDto[];

  constructor(partial: Partial<ChatSessionResponseDto>) {
    Object.assign(this, partial);
  }
}
