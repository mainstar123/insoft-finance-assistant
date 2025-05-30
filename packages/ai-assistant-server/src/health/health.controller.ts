import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Check if the heap memory usage is below 90% of the heap size limit
      () => this.memory.checkHeap('memory_heap', 90 * 1024 * 1024),
      // Check if the RSS memory usage is below 90% of the RSS memory limit
      () => this.memory.checkRSS('memory_rss', 90 * 1024 * 1024),
      // Check if the disk storage is below 90% of the available space
      () =>
        this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
      // Check if the database is accessible
      () => this.prismaHealth.isHealthy('database'),
    ]);
  }

  @Get('liveness')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([
      // Simple check to verify the application is running
      () => ({ liveness: { status: 'up' } }),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      // Check if the database is accessible
      () => this.prismaHealth.isHealthy('database'),
    ]);
  }
}
