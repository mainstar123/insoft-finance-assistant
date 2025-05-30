import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { MetricsService } from '../services/metrics.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Controller for exposing metrics
 */
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Get metrics in Prometheus format
   */
  @Get('current')
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Get metrics in Prometheus format' })
  @ApiResponse({
    status: 200,
    description: 'Metrics in Prometheus format',
    type: String,
  })
  async getMetrics(): Promise<string> {
    return await this.metricsService.getMetrics();
  }

  /**
   * Reset metrics
   */
  @Get('reset')
  @ApiOperation({ summary: 'Reset metrics' })
  @ApiResponse({
    status: 200,
    description: 'Metrics reset',
  })
  async resetMetrics(): Promise<{ message: string }> {
    await this.metricsService.resetMetrics();
    return { message: 'Metrics reset' };
  }
}
