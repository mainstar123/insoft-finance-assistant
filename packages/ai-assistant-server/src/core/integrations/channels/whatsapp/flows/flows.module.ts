import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '../../../../../config';
import { UserModule } from '@/features/user/user.module';
import { BaseFlowService } from './services/base-flow.service';
import { FlowsEncryptionService } from './services/encryption-flow.service';
import { RegistrationFlowService } from './services/registration-flow.service';
import { WhatsAppModule } from '../whatsapp.module';
import { FlowMessagingService } from './services/flow-messaging.service';
import { RawBodyMiddleware } from './middleware/raw-body.middleware';
import { HttpModule } from '@nestjs/axios';

/**
 * WhatsApp Flows Module
 * Handles the registration flow for WhatsApp users
 */
@Module({
  imports: [
    ConfigModule,
    UserModule,
    WhatsAppModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: `https://graph.facebook.com/${configService.getWhatsAppConfig().apiVersion}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${configService.getWhatsAppConfig().apiKey}`,
        },
      }),
    }),
  ],
  providers: [
    BaseFlowService,
    FlowsEncryptionService,
    RegistrationFlowService,
    FlowMessagingService,
  ],
  exports: [
    BaseFlowService,
    FlowsEncryptionService,
    RegistrationFlowService,
    FlowMessagingService,
  ],
})
export class WhatsAppFlowsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply raw body middleware to all WhatsApp Flow routes
    consumer.apply(RawBodyMiddleware).forRoutes({
      path: 'whatsapp/flows/*pathname',
      method: RequestMethod.ALL,
    });
  }
}
