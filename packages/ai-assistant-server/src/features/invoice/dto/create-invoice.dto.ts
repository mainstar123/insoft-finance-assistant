import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsDate, IsBoolean, Min } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsInt()
  creditCardId!: number;

  @ApiProperty()
  @IsDate()
  invoiceDate!: Date;

  @ApiProperty()
  @IsDate()
  closingDate!: Date;

  @ApiProperty()
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty()
  @IsBoolean()
  isArchived: boolean = false;

  @ApiProperty()
  @IsBoolean()
  isPaid: boolean = false;
}
