import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppMessageService } from '../../services/whatsapp-message.service';
import { BaseFlowService } from './base-flow.service';
import { WhatsAppService } from '../../services/whatsapp.service';

type Language = 'pt-BR' | 'pt' | 'en-US' | 'en';
type RegistrationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'CONFIRMED';

interface LocalizedContent {
  header: string;
  message: string;
  footer: string;
  cta: string;
}

/**
 * Service for sending WhatsApp flow messages
 * Focused on registration flow functionality with multi-language support
 */
@Injectable()
export class FlowMessagingService {
  private readonly logger = new Logger(FlowMessagingService.name);

  // Localized content for different languages
  private readonly localizedContent: Record<
    'en' | 'pt',
    Record<RegistrationStatus, LocalizedContent>
  > = {
    en: {
      NOT_STARTED: {
        header: 'Welcome to Tamy Finance',
        message: 'Please fill out the form to create your account.',
        footer: 'Tap the button below to continue',
        cta: 'Create account',
      },
      IN_PROGRESS: {
        header: 'Welcome to Tamy Finance',
        message: 'Please fill out the form to confirm your account.',
        footer: 'Tap the button below to continue',
        cta: 'Confirm',
      },
      CONFIRMED: {
        header: 'Welcome to Tamy Finance',
        message: 'Please fill out the form to update your account.',
        footer: 'Tap the button below to continue',
        cta: 'Update account',
      },
    },
    pt: {
      NOT_STARTED: {
        header: 'Bem-vindo à Tamy Finance',
        message: 'Por favor, preencha o formulário para criar sua conta.',
        footer: 'Toque no botão abaixo para continuar',
        cta: 'Criar conta',
      },
      IN_PROGRESS: {
        header: 'Bem-vindo à Tamy Finance',
        message: 'Por favor, preencha o formulário para confirmar sua conta.',
        footer: 'Toque no botão abaixo para continuar',
        cta: 'Confirmar',
      },
      CONFIRMED: {
        header: 'Bem-vindo à Tamy Finance',
        message: 'Por favor, preencha o formulário para atualizar sua conta.',
        footer: 'Toque no botão abaixo para continuar',
        cta: 'Atualizar conta',
      },
    },
  };

  constructor(
    private readonly whatsAppMessageService: WhatsAppMessageService,
    private readonly baseFlowService: BaseFlowService,
    private readonly whatsAppService: WhatsAppService,
  ) {
    this.logger.log('Flow messaging service initialized');
  }

  /**
   * Get the appropriate language content
   * @param language The user's language preference
   * @returns The base language code ('en' or 'pt')
   */
  private getLanguageBase(language: Language): 'en' | 'pt' {
    return language.startsWith('pt') ? 'pt' : 'en';
  }

  /**
   * Send a registration flow message to a user
   * @param to The recipient's phone number
   * @param status The user's registration status
   * @param userData Optional user data to pre-fill the form
   * @param language The user's preferred language (defaults to pt-BR)
   * @returns The WhatsApp API response
   */
  async sendRegistrationFlow(
    to: string,
    status: RegistrationStatus,
    userData?: {
      name?: string;
      email?: string;
      phoneNumber?: string;
      marketingConsent?: boolean;
    },
    language: Language = 'pt-BR',
  ): Promise<any> {
    this.logger.debug(
      `Sending registration flow to ${to} with status ${status} in language ${language}`,
    );

    try {
      const baseLanguage = this.getLanguageBase(language);
      const flowId = this.baseFlowService.getFlowId(
        baseLanguage === 'pt' ? 'register-user-flow' : 'register-user-flow-en',
      );

      const content = this.localizedContent[baseLanguage][status];

      // Create flow data with proper structure
      const flowData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'flow',
          header: {
            type: 'text',
            text: content.header,
          },
          body: {
            text: content.message,
          },
          footer: {
            text: content.footer,
          },
          action: {
            name: 'flow',
            parameters: {
              flow_message_version: '3',
              flow_id: flowId,
              flow_token: 'unused',
              flow_cta: content.cta,
              flow_action: 'navigate',
              flow_action_payload: {
                screen: 'ENTRY',
                data: {
                  phone_number: to,
                  ...userData,
                },
              },
            },
          },
        },
      };

      this.logger.debug('Sending registration flow message:', {
        to,
        flowId,
        status,
        language,
        payload: JSON.stringify(flowData, null, 2),
      });

      return this.whatsAppService.sendMessage(to, 'interactive', flowData);
    } catch (error) {
      this.logger.error(
        `Error sending registration flow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
