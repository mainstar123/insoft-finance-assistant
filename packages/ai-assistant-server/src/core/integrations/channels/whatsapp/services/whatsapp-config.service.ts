import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../../../../config';

@Injectable()
export class WhatsAppConfigService {
  private readonly logger = new Logger(WhatsAppConfigService.name);
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment = this.configService.isDevelopment();

    if (this.isConfigValid()) {
      this.logger.log('WhatsApp config service initialized successfully');
    } else {
      this.logger.warn(
        'WhatsApp config service initialized with warnings - some features may not work correctly',
      );
    }
  }

  /**
   * Check if the configuration is valid
   * @returns Whether the configuration is valid
   */
  isConfigValid(): boolean {
    // In development mode, always consider the config valid to allow testing
    if (this.isDevelopment) {
      this.logger.log(
        'Running in development mode - using mock WhatsApp configuration',
      );
      return true;
    }

    const whatsappConfig = this.configService.getWhatsAppConfig();
    let isValid = true;

    if (
      !whatsappConfig.phoneNumberId ||
      whatsappConfig.phoneNumberId.trim() === ''
    ) {
      this.logger.warn(
        'WHATSAPP_PHONE_NUMBER_ID is not set or empty - WhatsApp messaging will not work',
      );
      isValid = false;
    }

    if (!whatsappConfig.apiKey || whatsappConfig.apiKey.trim() === '') {
      this.logger.warn(
        'Neither WHATSAPP_ACCESS_TOKEN nor WHATSAPP_API_KEY is set or empty - WhatsApp messaging will not work',
      );
      isValid = false;
    }

    if (
      !whatsappConfig.verifyToken ||
      whatsappConfig.verifyToken.trim() === ''
    ) {
      this.logger.warn(
        'WHATSAPP_VERIFY_TOKEN is not set or empty - WhatsApp webhook verification will not work',
      );
      isValid = false;
    }

    if (!whatsappConfig.appSecret || whatsappConfig.appSecret.trim() === '') {
      this.logger.warn(
        'WHATSAPP_APP_SECRET is not set or empty - WhatsApp webhook signature verification will be skipped',
      );
    }

    if (!whatsappConfig.privateKey || whatsappConfig.privateKey.trim() === '') {
      this.logger.warn(
        'WHATSAPP_PRIVATE_KEY is not set or empty - WhatsApp encryption features will not work',
      );
    }

    if (!whatsappConfig.passphrase || whatsappConfig.passphrase.trim() === '') {
      this.logger.warn(
        'WHATSAPP_PASSPHRASE is not set or empty - WhatsApp encryption features will not work',
      );
    }

    return isValid;
  }

  /**
   * Get the phone number ID
   * @returns The phone number ID
   */
  getPhoneNumberId(): string {
    return this.configService.getWhatsAppConfig().phoneNumberId;
  }

  /**
   * Get the WABA ID
   * @returns The WABA ID
   */
  getWabaId(): string {
    return this.configService.getWhatsAppConfig().wabaId;
  }

  /**
   * Get the access token
   * @returns The access token
   */
  getAccessToken(): string {
    return this.configService.getWhatsAppConfig().apiKey;
  }

  /**
   * Get the API version
   * @returns The API version
   */
  getApiVersion(): string {
    return this.configService.getWhatsAppConfig().apiVersion;
  }

  /**
   * Get the verify token
   * @returns The verify token
   */
  getVerifyToken(): string {
    return this.configService.getWhatsAppConfig().verifyToken;
  }

  /**
   * Get the app secret
   * @returns The app secret
   */
  getAppSecret(): string {
    return this.configService.getWhatsAppConfig().appSecret;
  }

  /**
   * Get the private key
   * @returns The private key
   */
  getPrivateKey(): string {
    return this.configService.getWhatsAppConfig().privateKey;
  }

  /**
   * Get the passphrase
   * @returns The passphrase
   */
  getPassphrase(): string {
    return this.configService.getWhatsAppConfig().passphrase;
  }

  /**
   * Check if running in development mode
   * @returns Whether running in development mode
   */
  isDevelopmentMode(): boolean {
    return this.isDevelopment;
  }
}
