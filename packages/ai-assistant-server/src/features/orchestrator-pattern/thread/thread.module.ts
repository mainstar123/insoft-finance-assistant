import { Module } from '@nestjs/common';
import { ThreadManagerService } from './thread-manager.service';
import { RedisModule } from '../../../core/integrations/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [ThreadManagerService],
  exports: [ThreadManagerService],
})
export class ThreadModule {}
