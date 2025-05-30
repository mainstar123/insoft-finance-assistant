import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ required: false })
  userId?: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  color?: string;

  @ApiProperty({ required: false })
  parentId?: number;

  @ApiProperty()
  createdAt!: Date;
}
