import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@/core/integrations/database/types';

export class TransactionResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  accountId!: number;

  @ApiProperty({ required: false })
  categoryId?: number;

  @ApiProperty({ required: false })
  subCategoryId?: number;

  @ApiProperty({ required: false })
  invoiceId?: number;

  @ApiProperty({ required: false })
  oppositeAccountId?: number;

  @ApiProperty({ required: false })
  investmentAsset?: string;

  @ApiProperty({ required: false })
  investmentType?: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  amountCents!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: TransactionType })
  type!: TransactionType;

  @ApiProperty()
  date!: Date;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ required: false })
  isArchived?: boolean;

  @ApiProperty({ required: false })
  isPaid?: boolean;

  @ApiProperty({ required: false })
  broker?: string;

  constructor(partial: Partial<TransactionResponseDto>) {
    Object.assign(this, partial);
  }
}
