import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@/core/integrations/database/types';

export class AccountResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  balanceCents!: number;

  @ApiProperty()
  balanceCurrency!: string;

  @ApiProperty({ enum: AccountType })
  type!: AccountType;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  isArchived!: boolean;

  constructor(partial: Partial<AccountResponseDto>) {
    Object.assign(this, partial);
  }
}
