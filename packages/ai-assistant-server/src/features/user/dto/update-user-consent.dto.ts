import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserConsentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;
}
