import { ApiProperty } from '@nestjs/swagger';

export class UserFeedbackResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ required: false })
  userId?: number;

  @ApiProperty()
  answers!: Record<string, any>;

  @ApiProperty({ required: false })
  openComments?: string;

  @ApiProperty()
  submittedAt!: Date;

  constructor(partial: Partial<UserFeedbackResponseDto>) {
    Object.assign(this, partial);
  }
}
