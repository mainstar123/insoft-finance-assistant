import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { HealthCheck } from '../interfaces/health.interface';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async checkHealth(): Promise<HealthCheck> {
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
