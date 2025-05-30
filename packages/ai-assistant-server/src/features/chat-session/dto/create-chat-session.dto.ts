import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length } from 'class-validator';

export class CreateChatSessionDto {
  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty()
  @IsString()
  @Length(1, 50)
  status!: string;
}

export class AddChatMessageDto {
  @ApiProperty()
  @IsString()
  @Length(1, 20)
  sender!: string;

  @ApiProperty()
  @IsString()
  message!: string;
}
