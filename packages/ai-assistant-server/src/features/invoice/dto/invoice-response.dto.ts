import { ApiProperty } from '@nestjs/swagger';

export class InvoiceResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  creditCardId!: number;

  @ApiProperty()
  invoiceDate!: Date;

  @ApiProperty()
  closingDate!: Date;

  @ApiProperty()
  amountCents!: number;

  @ApiProperty()
  isArchived!: boolean;

  @ApiProperty()
  isPaid!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<InvoiceResponseDto>) {
    Object.assign(this, partial);
  }
}
