import {
  Module,
  OnModuleInit,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from './core/core.module';
import { FeaturesModule } from './features/features.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { APP_FILTER } from '@nestjs/core';
// import { LangGraphModule } from './features/finance-office-multi-agent/langgraph.module';
import { ConfigModule } from './config';
import { HealthModule } from './health/health.module';
import { ConfigService } from './config';
import { LoggerConfig } from './core/services/logger.config';
import { LoggerService, MetricsService } from './core/services';
import { MetricsModule } from './core/metrics/metrics.module';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { CircuitBreakerModule } from './core/circuit-breaker/circuit-breaker.module';
import { WhatsAppFlowMiddleware } from './core/middleware/whatsapp-flow.middleware';
import { WhatsAppWebhookMiddleware } from './core/middleware/whatsapp-webhook.middleware';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    CoreModule,
    FeaturesModule,
    // LangGraphModule,
    HealthModule,
    MetricsModule,
    CircuitBreakerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Register the GlobalExceptionFilter for custom error handling
    {
      provide: APP_FILTER,
      useFactory: (
        configService: ConfigService,
        loggerService: LoggerService,
      ) => {
        return new GlobalExceptionFilter(loggerService, configService);
      },
      inject: [ConfigService, LoggerService],
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Initialize LoggerConfig with ConfigService
    LoggerConfig.setConfigService(this.configService);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');

    consumer.apply(WhatsAppWebhookMiddleware).forRoutes('/whatsapp/webhook');

    consumer.apply(WhatsAppFlowMiddleware).forRoutes('/whatsapp/flows');
  }
}
