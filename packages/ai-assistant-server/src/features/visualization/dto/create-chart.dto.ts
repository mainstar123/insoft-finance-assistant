import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ChartType } from '../interfaces/chart-options.interface';

export class ChartOptionsDto {
  @ApiProperty({ description: 'Chart title', required: false })
  @IsString()
  @IsOptional()
  title?: string = undefined;

  @ApiProperty({ description: 'Chart width in pixels', required: false })
  @IsNumber()
  @IsOptional()
  width?: number = undefined;

  @ApiProperty({ description: 'Chart height in pixels', required: false })
  @IsNumber()
  @IsOptional()
  height?: number = undefined;

  @ApiProperty({
    description: 'Background color (hex or named color)',
    required: false,
  })
  @IsString()
  @IsOptional()
  backgroundColor?: string = undefined;

  @ApiProperty({
    description: 'Chart image format',
    enum: ['png', 'jpeg', 'webp', 'svg'],
    required: false,
  })
  @IsString()
  @IsOptional()
  format?: 'png' | 'jpeg' | 'webp' | 'svg' = undefined;

  @ApiProperty({
    description: 'Theme for the chart',
    enum: ['light', 'dark'],
    required: false,
  })
  @IsString()
  @IsOptional()
  theme?: 'light' | 'dark' = undefined;

  @ApiProperty({
    description: 'Font family for chart text',
    required: false,
  })
  @IsString()
  @IsOptional()
  fontFamily?: string = undefined;

  @ApiProperty({
    description: 'Legend position',
    enum: ['top', 'bottom', 'left', 'right', 'none'],
    required: false,
  })
  @IsString()
  @IsOptional()
  legendPosition?: 'top' | 'bottom' | 'left' | 'right' | 'none' = undefined;

  @ApiProperty({
    description: 'URL for logo/watermark',
    required: false,
  })
  @IsString()
  @IsOptional()
  logoUrl?: string = undefined;

  @ApiProperty({
    description: 'Position for logo/watermark',
    enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'],
    required: false,
  })
  @IsString()
  @IsOptional()
  logoPosition?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'center' = undefined;
}

export class ChartDataPointDto {
  @ApiProperty({ description: 'X value (can be string, number, or date)' })
  @IsString()
  x: string = '';

  @ApiProperty({ description: 'Y value (numeric)' })
  @IsNumber()
  y: number = 0;

  @ApiProperty({
    description: 'Optional label for the data point',
    required: false,
  })
  @IsString()
  @IsOptional()
  label?: string = undefined;
}

export class ChartDataSeriesDto {
  @ApiProperty({ description: 'Name of the data series' })
  @IsString()
  name: string = '';

  @ApiProperty({
    description: 'Array of data points',
    type: [ChartDataPointDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChartDataPointDto)
  data: ChartDataPointDto[] = [];
}

export class ChartDataDto {
  @ApiProperty({
    description: 'Array of data series',
    type: [ChartDataSeriesDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChartDataSeriesDto)
  series: ChartDataSeriesDto[] = [];

  @ApiProperty({
    description: 'Optional labels for the chart',
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[] = undefined;
}

export class CreateChartDto {
  @ApiProperty({ description: 'Type of chart to generate', enum: ChartType })
  @IsEnum(ChartType)
  type: ChartType = ChartType.LINE;

  @ApiProperty({
    description: 'Chart data (optional if using predefined charts)',
    required: false,
    type: ChartDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChartDataDto)
  data?: ChartDataDto = undefined;

  @ApiProperty({
    description: 'Chart options',
    required: false,
    type: ChartOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChartOptionsDto)
  options?: ChartOptionsDto = undefined;

  @ApiProperty({ description: 'User ID', required: true })
  @IsNumber()
  userId: number = 0;

  @ApiProperty({
    description: 'Start date for data range (ISO format)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string = undefined;

  @ApiProperty({
    description: 'End date for data range (ISO format)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string = undefined;

  @ApiProperty({ description: 'Categories to include', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[] = undefined;

  @ApiProperty({ description: 'Account IDs to include', required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  accounts?: number[] = undefined;

  @ApiProperty({ description: 'Credit card IDs to include', required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  creditCards?: number[] = undefined;

  @ApiProperty({
    description: 'Whether to include income transactions',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  includeIncome?: boolean = undefined;

  @ApiProperty({
    description: 'How to group the data',
    enum: ['day', 'week', 'month', 'year', 'category'],
    required: false,
  })
  @IsString()
  @IsOptional()
  groupBy?: 'day' | 'week' | 'month' | 'year' | 'category' = undefined;
}
