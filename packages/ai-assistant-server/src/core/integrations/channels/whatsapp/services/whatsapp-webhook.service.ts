import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { WhatsAppConfigService } from './whatsapp-config.service';

/**
 * Service for handling WhatsApp webhook events
 */
@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);
  private readonly messageListeners: Array<(message: any) => void> = [];
  private whatsappWabaId: string | undefined;
  private whatsappPhoneNumberId: string | undefined;
  private verifyToken: string | undefined;
  constructor(private readonly whatsAppConfigService: WhatsAppConfigService) {
    this.logger.log('WhatsApp webhook service initialized');
    this.whatsappWabaId = this.whatsAppConfigService.getWabaId();
    this.whatsappPhoneNumberId = this.whatsAppConfigService.getPhoneNumberId();
    this.verifyToken = this.whatsAppConfigService.getVerifyToken();

    if (!this.whatsappWabaId || !this.whatsappPhoneNumberId) {
      this.logger.warn(
        'WhatsApp webhook service initialized with missing configuration',
      );
      throw new Error(
        'WhatsApp webhook service initialized with missing configuration, check the .env file for the following variables: WHATSAPP_WABA_ID, WHATSAPP_PHONE_NUMBER_ID',
      );
    }
  }

  /**
   * Verify a webhook request
   * @param mode The mode parameter from the request
   * @param token The token parameter from the request
   * @returns True if the request is valid, false otherwise
   */
  verifyWebhook(mode: string, token: string): boolean {
    if (!this.verifyToken) {
      this.logger.warn('WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set');
      return false;
    }

    return mode === 'subscribe' && token === this.verifyToken;
  }

  /**
   * Verify the webhook signature
   * @param signature The signature
   * @param body The request body
   * @returns Whether the signature is valid
   */
  verifySignature(signature: string, body: string): boolean {
    const appSecret = this.whatsAppConfigService.getAppSecret();

    if (!appSecret) {
      this.logger.warn(
        'App secret is not set, skipping signature verification',
      );
      return true;
    }

    if (!signature) {
      this.logger.warn('No signature provided');
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', appSecret);
      hmac.update(body);
      const expectedSignature = `sha256=${hmac.digest('hex')}`;

      this.logger.debug('Verifying signature', {
        providedSignature: signature.substring(0, 20) + '...',
        expectedSignaturePrefix: expectedSignature.substring(0, 20) + '...',
      });

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error(
        `Error verifying signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  /**
   * Handle a webhook event
   * @param body The webhook event body
   */
  handleWebhookEvent(body: any): void {
    try {
      // this.logger.debug('Received webhook event', {
      //   object: body.object,
      //   entryCount: body.entry?.length || 0,
      // });

      // Process messages
      if (body.object === 'whatsapp_business_account') {
        if (body.entry && body.entry.length > 0) {
          for (const entry of body.entry) {
            if (entry.changes && entry.changes.length > 0) {
              for (const change of entry.changes) {
                const changeIndex = entry.changes.indexOf(change);
                const entryIndex = body.entry.indexOf(entry);

                if (
                  entry.id !== this.whatsappWabaId &&
                  change.value.metadata.phone_number_id !==
                    this.whatsappPhoneNumberId
                ) {
                  // this.logger.warn(
                  //   `Skipping change ${changeIndex} for entry ${entryIndex} because the phone number id is not the same as the configured phone number id, wabaId: ${entry.id} phoneNumberId: ${change.value.metadata.phone_number_id} configuredPhoneNumberId: ${this.whatsappPhoneNumberId}`,
                  // );
                  continue;
                }

                if (
                  change.value &&
                  change.value.messages &&
                  change.value.messages.length > 0
                ) {
                  this.logger.debug('Found messages in webhook event', {
                    messageCount: change.value.messages.length,
                  });

                  for (const message of change.value.messages) {
                    this.processMessage(message, change.value);
                  }
                } else {
                  this.logger.debug('No messages found in change', {
                    changeField: change.field,
                    valueKeys: change.value
                      ? Object.keys(change.value)
                      : 'null',
                  });
                }
              }
            } else {
              this.logger.debug('No changes found in entry', {
                entryId: entry.id,
                entryKeys: Object.keys(entry),
              });
            }
          }
        } else {
          this.logger.debug('No entries found in webhook event');
        }
      } else {
        this.logger.debug(
          `Ignoring non-WhatsApp webhook event: ${body.object}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling webhook event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Process a message from the webhook
   * @param message The message
   * @param metadata Additional metadata
   */
  private processMessage(message: any, metadata: any): void {
    try {
      this.logger.debug('Processing message', {
        messageId: message.id,
        messageType: message.type,
        from: message.from,
        timestamp: message.timestamp,
      });

      // Early return for form submission acknowledgments
      if (
        message.type === 'interactive' &&
        message.interactive?.type === 'nfm_reply'
      ) {
        this.logger.debug('Ignoring form submission acknowledgment', {
          messageId: message.id,
          response: message.interactive.nfm_reply.response_json,
        });
        return;
      }

      // Emit the message to any listeners
      if (this.messageListeners.length === 0) {
        this.logger.warn(
          'No message listeners registered, message will be ignored',
        );
        return;
      }

      for (const listener of this.messageListeners) {
        try {
          listener({
            message,
            metadata,
          });
        } catch (error) {
          this.logger.error(
            `Error in message listener: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Register a listener for incoming messages
   * @param listener The listener function
   */
  onMessage(listener: (message: any) => void): void {
    this.messageListeners.push(listener);
    this.logger.debug(
      `Registered message listener, total: ${this.messageListeners.length}`,
    );
  }
}
