import { Injectable } from '@nestjs/common';
import { HealthService } from './core/services';
import { HealthCheck } from './core/interfaces/health.interface';

@Injectable()
export class AppService {
  constructor(private healthService: HealthService) {}

  getHealth(): Promise<HealthCheck> {
    return this.healthService.checkHealth();
  }
}
