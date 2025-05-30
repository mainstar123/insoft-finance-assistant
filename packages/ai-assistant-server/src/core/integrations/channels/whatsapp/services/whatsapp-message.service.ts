import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppConfigService } from './whatsapp-config.service';

/**
 * Service for sending WhatsApp messages
 * Focused on registration flow functionality
 */
@Injectable()
export class WhatsAppMessageService {
  private readonly logger = new Logger(WhatsAppMessageService.name);
  private readonly phoneNumberId: string;
  private readonly isDevelopment: boolean;

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly whatsAppConfigService: WhatsAppConfigService,
  ) {
    this.phoneNumberId = this.whatsAppConfigService.getPhoneNumberId();
    this.isDevelopment = this.whatsAppConfigService.isDevelopmentMode();
    this.logger.log('WhatsApp message service initialized');
  }

  /**
   * Send a message to a WhatsApp user
   * @param to The recipient's phone number
   * @param message The message to send (string or object)
   * @returns The WhatsApp API response
   */
  async sendMessage(
    to: string,
    message: string | Record<string, any>,
  ): Promise<any> {
    try {
      this.logger.debug(`Sending message to ${to}`);

      // In development mode, skip strict validation
      if (!this.isDevelopment) {
        // Check if WhatsApp configuration is valid
        if (!this.whatsAppConfigService.isConfigValid()) {
          throw new Error(
            'WhatsApp configuration is invalid. Please check your environment variables.',
          );
        }
      }

      // Validate recipient phone number
      if (!to || to.trim() === '') {
        throw new Error('Recipient phone number is empty or not provided');
      }

      // Handle message payload
      let messagePayload: Record<string, any>;
      if (typeof message === 'string') {
        try {
          messagePayload = JSON.parse(message);
          this.logger.debug('Parsed message as JSON');
        } catch (e) {
          // Not a JSON string, send as text
          messagePayload = { text: { body: message } };
          this.logger.debug('Sending as text message');
        }
      } else {
        // Message is already an object
        messagePayload = message;
        this.logger.debug('Using provided message object');
      }

      // Send the message with appropriate type
      const type = messagePayload.type || 'text';
      console.log(
        '🚀 ~ WhatsAppMessageService ~ messagePayload:',
        messagePayload,
      );
      console.log('🚀 ~ WhatsAppMessageService ~ type:', type);
      console.log('🚀 ~ WhatsAppMessageService ~ to:', to);
      return this.whatsAppService.sendMessage(to, type, messagePayload);
    } catch (error) {
      console.log('🚀 ~ WhatsAppMessageService ~ sendMessage ~ error:', error);
      this.logger.error(
        `Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Send a text message to a WhatsApp user
   * @param to The recipient's phone number
   * @param text The text message
   * @returns The WhatsApp API response
   */
  async sendTextMessage(to: string, text: string): Promise<any> {
    try {
      if (!this.isDevelopment && !this.whatsAppConfigService.isConfigValid()) {
        throw new Error('WhatsApp configuration is invalid');
      }

      const phoneNumberId = this.whatsAppConfigService.getPhoneNumberId();

      if (
        !this.isDevelopment &&
        (!phoneNumberId || phoneNumberId.trim() === '')
      ) {
        throw new Error('WhatsApp phone number ID is not configured');
      }

      const payload = {
        text: {
          body: text,
        },
      };

      this.logger.debug(
        `Sending text message to ${to}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
      );

      return this.whatsAppService.sendMessage(to, 'text', payload);
    } catch (error) {
      this.logger.error(`Failed to send text message to ${to}`, error);
      throw error;
    }
  }

  /**
   * Send a media message to a WhatsApp user
   * @param to The recipient's phone number
   * @param mediaType The type of media (image, audio, document, video)
   * @param mediaUrl The URL of the media
   * @param caption Optional caption for the media
   * @returns The WhatsApp API response
   */
  async sendMediaMessage(
    to: string,
    mediaType: 'image' | 'audio' | 'document' | 'video',
    mediaUrl: string,
    caption?: string,
  ): Promise<any> {
    try {
      if (!this.isDevelopment && !this.whatsAppConfigService.isConfigValid()) {
        throw new Error('WhatsApp configuration is invalid');
      }

      const phoneNumberId = this.whatsAppConfigService.getPhoneNumberId();

      if (
        !this.isDevelopment &&
        (!phoneNumberId || phoneNumberId.trim() === '')
      ) {
        throw new Error('WhatsApp phone number ID is not configured');
      }

      const payload = {
        [mediaType]: {
          link: mediaUrl,
          caption: caption || '',
        },
      };

      this.logger.debug(`Sending ${mediaType} message to ${to}: ${mediaUrl}`);

      return this.whatsAppService.sendMessage(to, mediaType, payload);
    } catch (error) {
      this.logger.error(`Failed to send ${mediaType} message to ${to}`, error);
      throw error;
    }
  }
}
