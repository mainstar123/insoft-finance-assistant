import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CategoryTransactionDto {
  @ApiProperty()
  @IsInt()
  categoryId!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  subCategoryId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
