import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsString,
  IsOptional,
  IsDate,
  Min,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@/core/integrations/database/types';

export class CreateTransactionDto {
  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty()
  @IsInt()
  accountId!: number;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  subCategoryId?: number;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty()
  @IsDate()
  date!: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  oppositeAccountId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  investmentAsset?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  investmentType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  broker?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
