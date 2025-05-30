import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsEnum,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FinancialGoal, Gender } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'User full name', minLength: 3 })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({ description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    required: false,
    description: 'User phone number',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Terms and conditions acceptance' })
  @IsNotEmpty()
  @IsBoolean()
  termsAccepted!: boolean; // use Default as true

  @ApiProperty({ description: 'Marketing communications consent' })
  @IsNotEmpty()
  @IsBoolean()
  marketingConsent!: boolean; // use Default as true

  @ApiProperty({ required: false, description: 'User postal code', nullable: true })
  @IsOptional()
  @IsString()
  postalCode?: string; // use Default as '00000-000'

  @ApiProperty({
    required: false,
    description: 'User locale',
    default: 'pt_BR',
  })
  @IsOptional()
  @IsString()
  locale?: string; // use Default as 'pt_BR'

  @ApiProperty({
    required: false,
    description: 'Preferred currency',
    default: 'BRL',
  })
  @IsOptional()
  @IsString()
  preferredCurrency?: string; // use Default as 'BRL'

  @ApiProperty({ required: false, description: 'Birth date', nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthDate?: Date;

  @ApiProperty({
    required: false,
    description: 'User gender',
    enum: Gender,
    default: Gender.OTHER,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    required: false,
    description: 'User primary financial goal',
    nullable: true,
  })
  @IsOptional()
  @IsEnum(FinancialGoal)
  primaryFinancialGoal?: FinancialGoal; // use Default as FinancialGoal.SAVE_MONEY

  @ApiProperty({
    required: false,
    description: 'User financial challenge',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  financialChallenge?: string; // use Default as 'Save for emergency'
}
