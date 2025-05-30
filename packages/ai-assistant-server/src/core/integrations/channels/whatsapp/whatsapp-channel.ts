import { Injectable, Logger } from '@nestjs/common';
import { BaseChannel } from '../base-channel';
import { ChannelType } from '../channel.interface';
import { WhatsAppMessageService } from './services/whatsapp-message.service';
import { WhatsAppWebhookService } from './services/whatsapp-webhook.service';

/**
 * WhatsApp channel implementation
 * Focused on registration flow functionality
 */
@Injectable()
export class WhatsAppChannel extends BaseChannel {
  public readonly logger = new Logger(WhatsAppChannel.name);

  constructor(
    private readonly whatsAppWebhookService: WhatsAppWebhookService,
    private readonly whatsAppMessageService: WhatsAppMessageService,
  ) {
    super();
    this.logger.log('WhatsApp channel initialized');

    // Register this channel to receive messages from the webhook service
    this.whatsAppWebhookService.onMessage(
      this.handleIncomingMessage.bind(this),
    );
    this.logger.log('Registered for WhatsApp webhook messages');
  }

  /**
   * Get the type of channel
   * @returns The channel type
   */
  getType(): ChannelType {
    return ChannelType.WHATSAPP;
  }

  /**
   * Send a message to a WhatsApp user
   * @param to The recipient's phone number
   * @param message The message to send
   * @returns The WhatsApp API response
   */
  async sendMessage(to: string, message: string): Promise<any> {
    try {
      this.logger.debug(`Sending message to ${to}`);
      return this.whatsAppMessageService.sendMessage(to, message);
    } catch (error) {
      this.logger.error(
        `Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Handle an incoming message from WhatsApp
   * @param message The incoming message
   */
  private async handleIncomingMessage(message: any): Promise<void> {
    try {
      const whatsappMessage = message.message;

      this.logger.debug('Received message from WhatsApp', {
        messageId: whatsappMessage.id,
        messageType: whatsappMessage.type,
        from: whatsappMessage.from,
        timestamp: whatsappMessage.timestamp,
      });

      // Extract the text content if available
      let textContent = '';
      if (whatsappMessage.type === 'text' && whatsappMessage.text) {
        textContent = whatsappMessage.text.body;
        this.logger.debug(`Message content: "${textContent}"`);
      } else {
        this.logger.debug(`Non-text message of type: ${whatsappMessage.type}`);
      }

      // Emit the message to any subscribers
      this.emitMessage({
        channelType: ChannelType.WHATSAPP,
        userPhone: whatsappMessage.from,
        content: textContent,
        timestamp: new Date(parseInt(whatsappMessage.timestamp) * 1000),
        rawMessage: message,
      });
    } catch (error) {
      this.logger.error(
        `Error handling incoming WhatsApp message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
