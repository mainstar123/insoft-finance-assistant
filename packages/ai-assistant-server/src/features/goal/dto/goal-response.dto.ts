import { ApiProperty } from '@nestjs/swagger';

export class GoalResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ required: false })
  accountId?: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  targetAmountCents!: number;

  @ApiProperty()
  currentAmountCents!: number;

  @ApiProperty({ required: false })
  dueDate?: Date;

  @ApiProperty()
  achieved!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<GoalResponseDto>) {
    Object.assign(this, partial);
  }
}
