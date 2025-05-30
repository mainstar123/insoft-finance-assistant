import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsBoolean,
  IsEnum,
  IsOptional,
  Min,
  Length,
  Matches,
} from 'class-validator';
import { AccountType } from '@/core/integrations/database/types';

export class CreateAccountDto {
  @ApiProperty()
  @IsInt()
  userId!: number;

  @ApiProperty()
  @IsString()
  @Length(2, 50)
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  description?: string;

  @ApiProperty({ default: 0 })
  @IsInt()
  @Min(0)
  balanceCents!: number;

  @ApiProperty({ default: 'BRL' })
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code' })
  balanceCurrency!: string;

  @ApiProperty({ enum: AccountType, default: AccountType.CHECKING })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiProperty({ default: false })
  @IsBoolean()
  isDefault!: boolean;
}
