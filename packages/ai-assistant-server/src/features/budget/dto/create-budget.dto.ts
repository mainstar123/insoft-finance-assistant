import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  IsBoolean,
  IsDate,
} from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiProperty()
  @IsBoolean()
  isGeneral!: boolean;

  @ApiProperty()
  @IsDate()
  period!: Date;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  spentCents!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  remainingCents!: number;

  @ApiProperty()
  @IsBoolean()
  isArchived!: boolean;
}
