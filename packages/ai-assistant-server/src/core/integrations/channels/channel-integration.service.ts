import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelType } from './channel.interface';
import { MessageBrokerService } from '../../messaging/message-broker.service';

/**
 * Service that integrates channels with the message broker
 * This service bridges the gap between the channel system and the message broker
 */
@Injectable()
export class ChannelIntegrationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ChannelIntegrationService.name);
  private readonly unsubscribeCallbacks: (() => void)[] = [];

  constructor(
    private readonly channelService: ChannelService,
    private readonly messageBroker: MessageBrokerService,
  ) {}

  /**
   * Initialize the service and subscribe to channel messages
   */
  onModuleInit() {
    this.logger.log('Initializing channel integration service');

    // Register with all channels
    const channels = this.channelService.getAllChannels();
    for (const channel of channels) {
      this.logger.log(`Registering with channel: ${channel.getType()}`);

      // Subscribe to channel messages
      const unsubscribe = channel.onMessage(
        this.handleChannelMessage.bind(this),
      );
      this.unsubscribeCallbacks.push(unsubscribe);
    }

    // Subscribe to AI responses
    const unsubscribeAiResponses = this.messageBroker.onAiResponse(
      this.handleAiResponse.bind(this),
    );
    this.unsubscribeCallbacks.push(unsubscribeAiResponses);

    this.logger.log('Channel integration service initialized');
  }

  /**
   * Clean up subscriptions when the module is destroyed
   */
  onModuleDestroy() {
    this.logger.log('Cleaning up channel integration service');

    for (const unsubscribe of this.unsubscribeCallbacks) {
      unsubscribe();
    }
  }

  /**
   * Handle a message from a channel
   * @param message The channel message
   */
  private handleChannelMessage(message: any): void {
    console.log("🚀 ~ handleChannelMessage ~ message:", message)
    try {
      this.logger.debug('Received message from channel', {
        channelType: message.channelType,
        userPhone: message.userPhone,
        content:
          message.content?.substring(0, 50) +
          (message.content?.length > 50 ? '...' : ''),
      });

      // Publish the message to the message broker
      this.messageBroker.publishUserMessage({
        userPhone: message.userPhone,
        content: message.content,
        channelId: message.channelType,
        attachments: message.attachments,
      });

      this.logger.debug(
        `Published user message to message broker for ${message.userPhone}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling channel message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Handle an AI response from the message broker
   * @param response The AI response
   */
  private async handleAiResponse(response: any): Promise<void> {
    try {
      this.logger.debug('Received AI response from message broker', {
        channelId: response.channelId,
        userPhone: response.userPhone,
        content:
          response.content?.substring(0, 50) +
          (response.content?.length > 50 ? '...' : ''),
      });

      // Get the channel type from the channel ID
      const channelType = response.channelId as ChannelType;

      // Get the channel
      const channel = this.channelService.getChannel(channelType);

      if (!channel) {
        this.logger.error(`Channel not found: ${channelType}`);
        return;
      }

      try {
        // Send the message to the channel
        await channel.sendMessage(response.userPhone, response.content);
        this.logger.debug(
          `Sent AI response to channel ${channelType} for ${response.userPhone}`,
        );
      } catch (error) {
        // Handle specific errors for different channels
        if (channelType === ChannelType.WHATSAPP) {
          if (
            error instanceof Error &&
            error.message.includes('phone number ID')
          ) {
            this.logger.error(
              `Failed to send message to WhatsApp: Invalid phone number ID configuration. Please check your WHATSAPP_PHONE_NUMBER_ID environment variable.`,
              { userPhone: response.userPhone, error: error.message },
            );
          } else if (
            error instanceof Error &&
            error.message.includes('access token')
          ) {
            this.logger.error(
              `Failed to send message to WhatsApp: Authentication failed. Please check your WHATSAPP_API_KEY environment variable.`,
              { userPhone: response.userPhone, error: error.message },
            );
          } else {
            this.logger.error(
              `Failed to send message to WhatsApp channel for user ${response.userPhone}`,
              { error: error instanceof Error ? error.message : String(error) },
            );
          }
        } else {
          this.logger.error(
            `Failed to send message to ${channelType} channel for user ${response.userPhone}`,
            { error: error instanceof Error ? error.message : String(error) },
          );
        }

        // Rethrow the error to be caught by the outer try-catch
        throw error;
      }
    } catch (error) {
      this.logger.error(
        `Error handling AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
