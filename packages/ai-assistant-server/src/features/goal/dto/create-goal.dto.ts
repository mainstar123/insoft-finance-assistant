import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  Length,
  IsBoolean,
  IsDate,
} from 'class-validator';

export class CreateGoalDto {
  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  accountId?: number;

  @ApiProperty()
  @IsString()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  targetAmountCents!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  currentAmountCents!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  dueDate?: Date;

  @ApiProperty()
  @IsBoolean()
  achieved!: boolean;
}
