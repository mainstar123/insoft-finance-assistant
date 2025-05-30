import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsObject, IsString } from 'class-validator';

export class CreateUserFeedbackDto {
  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiProperty()
  @IsObject()
  answers!: Record<string, any>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  openComments?: string;
}
