import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { VisualizationService } from '../services/visualization.service';
import { CreateChartDto } from '../dto/create-chart.dto';
import { ChartType } from '../interfaces/chart-options.interface';
import type {
  ChartResponse,
  LineChartOptions,
  BarChartOptions,
} from '../interfaces/chart-options.interface';

/**
 * Controller for financial data visualization endpoints
 */
@ApiTags('visualization')
@Controller('visualization')
export class VisualizationController {
  constructor(private readonly visualizationService: VisualizationService) {}

  /**
   * Generate a custom chart based on the provided parameters
   */
  @Post('chart')
  @ApiOperation({ summary: 'Generate a custom chart' })
  @ApiBody({ type: CreateChartDto })
  @ApiResponse({ status: 200, description: 'Chart generated successfully' })
  async generateChart(
    @Body() createChartDto: CreateChartDto,
  ): Promise<ChartResponse> {
    // Ensure the userId is set
    createChartDto.userId = 1;
    return this.visualizationService.generateChart(createChartDto);
  }

  /**
   * Generate a debt reduction progress chart
   */
  @Get('debt-reduction')
  @ApiOperation({ summary: 'Generate a debt reduction progress chart' })
  @ApiResponse({ status: 200, description: 'Chart generated successfully' })
  async generateDebtReductionChart(
    @Query() options?: LineChartOptions,
  ): Promise<ChartResponse> {
    return this.visualizationService.generateDebtReductionChart(1, options);
  }

  /**
   * Generate a budget vs. actual spending comparison chart
   */
  @Get('budget-comparison')
  @ApiOperation({
    summary: 'Generate a budget vs. actual spending comparison chart',
  })
  @ApiResponse({ status: 200, description: 'Chart generated successfully' })
  async generateBudgetComparisonChart(
    @Query() options?: BarChartOptions,
  ): Promise<ChartResponse> {
    return this.visualizationService.generateBudgetComparisonChart(1, options);
  }

  /**
   * Generate a cash flow projection chart
   */
  @Get('cash-flow-projection')
  @ApiOperation({ summary: 'Generate a cash flow projection chart' })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description: 'Number of months to project',
  })
  @ApiResponse({ status: 200, description: 'Chart generated successfully' })
  async generateCashFlowProjectionChart(
    @Query('months') months?: number,
    @Query() options?: LineChartOptions,
  ): Promise<ChartResponse> {
    return this.visualizationService.generateCashFlowProjectionChart(
      1,
      months,
      options,
    );
  }
}
