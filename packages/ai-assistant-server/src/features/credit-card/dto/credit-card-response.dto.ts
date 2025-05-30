import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditCardResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  cardNetwork?: string;

  @ApiProperty()
  closingDay!: number;

  @ApiProperty()
  dueDay!: number;

  @ApiProperty()
  limitCents!: number;

  @ApiProperty()
  limitPercentage!: number;

  @ApiProperty()
  currentDebtCents!: number;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  isArchived!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
