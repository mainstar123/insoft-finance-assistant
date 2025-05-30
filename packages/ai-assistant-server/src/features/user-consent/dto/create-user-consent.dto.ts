import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsString } from 'class-validator';

export class CreateUserConsentDto {
  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty()
  @IsString()
  type!: string;

  @ApiProperty()
  @IsBoolean()
  status!: boolean;
}
