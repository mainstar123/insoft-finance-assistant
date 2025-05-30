import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config';
import { ChannelService } from './channel.service';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ChannelIntegrationService } from './channel-integration.service';
import { MessageBrokerModule } from '../../messaging/message-broker.module';

@Module({
  imports: [ConfigModule, WhatsAppModule, MessageBrokerModule],
  providers: [ChannelService, ChannelIntegrationService],
  exports: [ChannelService],
})
export class ChannelsModule {}
