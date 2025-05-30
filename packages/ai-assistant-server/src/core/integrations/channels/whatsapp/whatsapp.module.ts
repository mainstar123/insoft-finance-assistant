import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@/config';
import { HttpModule } from '@nestjs/axios';

import { WhatsAppConfigService } from './services/whatsapp-config.service';
import { WhatsAppMessageService } from './services/whatsapp-message.service';
import { WhatsAppService } from './services/whatsapp.service';
import { WhatsAppWebhookController } from './controllers/whatsapp-webhook.controller';
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service';
import { WhatsAppChannel } from './whatsapp-channel';
import { WhatsAppFlowEncryptionService } from './services/whatsapp-flow-encryption.service';
import { WhatsAppFlowController } from './controllers/whatsapp-flow.controller';
import { RegisterUserFlowService } from './flows/register-user/register-user.service';
import { UserModule } from '@/features/user/user.module';
import { BaseFlowService } from './flows/base-flow.service';

/**
 * WhatsApp integration module
 * Focused on registration flow functionality
 */
@Module({
  imports: [
    ConfigModule,
    UserModule,
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
  controllers: [WhatsAppWebhookController, WhatsAppFlowController],
  providers: [
    WhatsAppConfigService,
    WhatsAppService,
    WhatsAppMessageService,
    WhatsAppWebhookService,
    WhatsAppChannel,
    WhatsAppFlowEncryptionService,
    RegisterUserFlowService,
    BaseFlowService,
  ],
  exports: [
    WhatsAppConfigService,
    WhatsAppService,
    WhatsAppMessageService,
    WhatsAppWebhookService,
    WhatsAppChannel,
    RegisterUserFlowService,
  ],
})
export class WhatsAppModule {}
