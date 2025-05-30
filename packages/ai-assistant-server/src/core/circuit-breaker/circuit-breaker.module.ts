import { Module } from '@nestjs/common';
import { CircuitBreakerController } from '../controllers/circuit-breaker.controller';

@Module({
  controllers: [CircuitBreakerController],
})
export class CircuitBreakerModule {}
