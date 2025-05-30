import { ApiProperty } from '@nestjs/swagger';

export class BudgetResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ required: false })
  categoryId?: number;

  @ApiProperty()
  isGeneral!: boolean;

  @ApiProperty()
  period!: Date;

  @ApiProperty()
  amountCents!: number;

  @ApiProperty()
  spentCents!: number;

  @ApiProperty()
  remainingCents!: number;

  @ApiProperty()
  isArchived!: boolean;

  @ApiProperty()
  createdAt!: Date;

  constructor(partial: Partial<BudgetResponseDto>) {
    Object.assign(this, partial);
  }
}
