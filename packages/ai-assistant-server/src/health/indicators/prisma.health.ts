import { PrismaService } from '@/core/services/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      // Execute a simple query to check if the database is accessible
      await this.prismaService.client.$queryRaw`SELECT 1`;
      return indicator.up();
    } catch (error: unknown) {
      return indicator.down({
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
