import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { WhatsAppConfigService } from './whatsapp-config.service';

/**
 * Service for interacting with the WhatsApp Cloud API
 * Focused on registration flow functionality
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly isDevelopment: boolean;
  private readonly wabaId: string;
  private readonly phoneNumberId: string;

  constructor(
    private readonly whatsAppConfigService: WhatsAppConfigService,
    private readonly httpService: HttpService,
  ) {
    this.isDevelopment = this.whatsAppConfigService.isDevelopmentMode();
    this.wabaId = this.whatsAppConfigService.getWabaId();
    this.phoneNumberId = this.whatsAppConfigService.getPhoneNumberId();

    if (!this.phoneNumberId) {
      throw new Error('WhatsApp phone number ID is not configured');
    }

    this.logger.log('WhatsApp service initialized');
  }

  /**
   * Send a message to a WhatsApp user
   * @param to The recipient's phone number
   * @param type The type of message
   * @param data The message data
   * @returns The WhatsApp API response
   */
  async sendMessage(
    to: string,
    type: string,
    data?: Record<string, any>,
  ): Promise<any> {
    try {
      if (!this.whatsAppConfigService.isConfigValid()) {
        throw new Error(
          'WhatsApp configuration is invalid. Please check your environment variables.',
        );
      }

      if (this.isDevelopment) {
        this.logger.log(`[DEV MODE] Simulating sending message to ${to}`);

        // Enhanced development mode logging
        this.logger.warn(`
=======================================================
🔔 WHATSAPP MESSAGE SIMULATION (DEV MODE) 🔔
-------------------------------------------------------
📱 To: ${to}
📝 Message: ${JSON.stringify(data?.text?.body || data, null, 2)}
-------------------------------------------------------
⚠️ This message was NOT actually sent to WhatsApp API
⚠️ To send real messages, configure WhatsApp credentials
   and set NODE_ENV to 'production'
=======================================================
        `);

        this.logger.debug(`[DEV MODE] Message payload:`, data);

        // Simulate a successful response
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: `simulated_msg_${Date.now()}` }],
        };
      }

      // // Handle interactive messages (like Flows) differently to preserve the proper structure
      // if (type === 'interactive') {
      //   this.logger.debug(
      //     'Sending interactive message with preserved structure',
      //   );

      //   const { data: responseData } = await firstValueFrom(
      //     this.httpService.post(`/${this.phoneNumberId}/messages`, {
      //       messaging_product: 'whatsapp',
      //       recipient_type: 'individual',
      //       to,
      //       ...data, // Keep type and interactive at the correct level
      //     }),
      //   );
      //   return responseData;
      // } else {
      // Handle other message types as before
      this.logger.debug('Sending standard message');

      const { data: responseData } = await firstValueFrom(
        this.httpService.post(`/${this.phoneNumberId}/messages`, {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          ...data,
        }),
      );
      return responseData;
      // }
    } catch (error) {
      console.log('🚀 ~ WhatsAppService ~ error:', error);
      if (this.isDevelopment) {
        this.logger.warn(
          `[DEV MODE] Error simulation: Would have failed to send message to ${to}`,
          error,
        );
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: `simulated_error_handled_${Date.now()}` }],
        };
      }

      this.logger.error(`Failed to send WhatsApp message to ${to}`, error);
      throw error;
    }
  }

  /**
   * Send a flow message directly to the WhatsApp API with the exact structure
   * @param messageData The complete message data structure
   * @returns The WhatsApp API response
   */
  private async sendDirectFlowMessage(
    messageData: Record<string, any>,
  ): Promise<any> {
    try {
      if (this.isDevelopment) {
        this.logger.warn(`[DEV MODE] Simulating sending flow message`);
        this.logger.debug(`[DEV MODE] Flow message payload:`, messageData);
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: messageData.to, wa_id: messageData.to }],
          messages: [{ id: `simulated_flow_msg_${Date.now()}` }],
        };
      }

      this.logger.debug('Sending direct flow message to WhatsApp API');

      const { data } = await firstValueFrom(
        this.httpService.post(`/${this.phoneNumberId}/messages`, messageData),
      );

      return data;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp flow message`, error);
      throw error;
    }
  }
}
