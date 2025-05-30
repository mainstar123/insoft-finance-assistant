import { Injectable, Logger } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { RegistrationFlowService } from '@/core/integrations/channels/whatsapp/flows/services/registration-flow.service';

@Injectable()
export class RegistrationTools {
  private readonly logger = new Logger(RegistrationTools.name);

  constructor(
    private readonly registrationFlowService: RegistrationFlowService,
  ) {}

  getAllTools(): DynamicStructuredTool[] {
    return [this.createSendRegistrationFormTool()];
  }

  private createSendRegistrationFormTool(): DynamicStructuredTool<any> {
    return new DynamicStructuredTool({
      name: 'send_registration_form',
      description: 'Send a WhatsApp registration form to the user',
      schema: z.object({
        phoneNumber: z
          .string()
          .describe("User's phone number to send the form to"),
        language: z
          .string()
          .describe('Language to send the form to'),
      }),
      func: async ({ phoneNumber, language }) => {
        console.log("🚀 ~ RegistrationTools ~ func: ~ language:", language)
        try {
          await this.registrationFlowService.sendRegistrationFlow(phoneNumber, language);

          return JSON.stringify({
            success: true,
            message:
              'We have sent you a registration form on WhatsApp. Please check your messages and fill in the form to create your account.',
          });
        } catch (error) {
          this.logger.error('Error sending registration form', error);
          return JSON.stringify({
            success: false,
            error: 'Failed to send registration form',
          });
        }
      },
    });
  }
}
