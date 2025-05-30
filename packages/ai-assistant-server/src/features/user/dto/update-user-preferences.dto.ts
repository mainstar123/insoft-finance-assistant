import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Matches, IsEnum } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateUserPreferencesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}_[A-Z]{2}$/, {
    message: 'Locale must be in format: xx_XX (e.g., en_US)',
  })
  locale?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be a 3-letter ISO code',
  })
  preferredCurrency?: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;
}
