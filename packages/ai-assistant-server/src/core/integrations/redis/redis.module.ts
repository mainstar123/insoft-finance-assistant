import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config/config.module';
import { RedisService } from './redis.service';
import { RedisPoolService } from './redis-pool.service';
import { ConfigService } from '@/config/config.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RedisService,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.getDatabaseConfig().redisUrl;
        console.log("🚀 ~ redisUrl:", redisUrl)
        return new RedisService({
          url: redisUrl,
          clientOptions: {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: RedisPoolService,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.getDatabaseConfig().redisUrl;
        console.log("🚀 ~ redisUrl:", redisUrl)
        return new RedisPoolService({
          url: redisUrl,
          poolOptions: {
            min: 2,
            max: 10,
          },
          clientOptions: {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            keyPrefix: 'langgraph:',
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService, RedisPoolService],
})
export class RedisModule {}
