import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import {
  PrismaService,
  ConfigService as CoreConfigService,
  LoggerService,
  HealthService,
} from './services';
import { WeaviateModule } from './integrations/weaviate/weaviate.module';
import { MessageBrokerModule } from './messaging/message-broker.module';
import { WhatsAppModule } from './integrations/channels/whatsapp/whatsapp.module';
import { ChannelsModule } from './integrations/channels/channels.module';
import { MediaProcessingModule } from './services/media-processing';
import { WinstonModule } from 'nest-winston';
import { LoggerConfig } from './services/logger.config';
import { AppLoggerService } from './services/app-logger.service';
import { CacheService } from './services/cache.service';
import { MetricsService } from './services/metrics.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { ConfigModule, ConfigService } from '../config';
import { RedisModule } from './integrations/redis/redis.module';
import { RedisService } from './integrations/redis/redis.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot(),
    ConfigModule,
    RedisModule,
    // Add Winston module for enhanced logging
    WinstonModule.forRoot({
      // Use the Winston logger directly, not the NestJS wrapper
      instance: LoggerConfig.createLogger('Application'),
    }),
    WeaviateModule,
    MessageBrokerModule,
    WhatsAppModule,
    ChannelsModule,
    MediaProcessingModule,
  ],
  providers: [
    PrismaService,
    CoreConfigService,
    // Provide AppLoggerService
    {
      provide: AppLoggerService,
      useFactory: () => {
        return new AppLoggerService('Application');
      },
    },
    // Provide LoggerService as a factory to ensure proper initialization
    {
      provide: LoggerService,
      useFactory: () => {
        return LoggerService.getLogger('Application');
      },
    },
    // Provide CacheService
    {
      provide: CacheService,
      useFactory: (
        configService: ConfigService,
        logger: LoggerService,
        redisService: RedisService,
      ) => {
        return new CacheService(configService, logger, redisService);
      },
      inject: [ConfigService, LoggerService, RedisService],
    },
    // Provide MetricsService
    {
      provide: MetricsService,
      useFactory: (logger: LoggerService) => {
        return new MetricsService(logger);
      },
      inject: [LoggerService],
    },
    {
      provide: CircuitBreakerService,
      useFactory: (logger: LoggerService, metricsService: MetricsService) => {
        return new CircuitBreakerService(logger, metricsService);
      },
      inject: [LoggerService, MetricsService],
    },
    HealthService,
  ],
  exports: [
    PrismaService,
    CoreConfigService,
    AppLoggerService,
    LoggerService,
    CacheService,
    MetricsService,
    HealthService,
    WeaviateModule,
    MessageBrokerModule,
    ChannelsModule,
    MediaProcessingModule,
    CircuitBreakerService,
  ],
})
export class CoreModule {}
