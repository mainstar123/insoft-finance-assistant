import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCreditCardDto {
  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cardNetwork?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(31)
  closingDay!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay!: number;

  @ApiProperty()
  @IsInt()
  limitCents!: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
