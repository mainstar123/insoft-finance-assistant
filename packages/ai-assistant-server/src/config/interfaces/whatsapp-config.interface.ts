/**
 * WhatsApp configuration interface
 */
export interface WhatsAppConfig {
  /**
   * WhatsApp phone number ID
   */
  phoneNumberId: string;

  /**
   * WhatsApp Business Account ID
   */
  wabaId: string;

  /**
   * WhatsApp API version
   */
  apiVersion: string;

  /**
   * WhatsApp API key / access token
   */
  apiKey: string;

  /**
   * WhatsApp webhook verification token
   */
  verifyToken: string;

  /**
   * WhatsApp app secret for webhook signature verification
   */
  appSecret: string;

  /**
   * WhatsApp private key for encryption
   */
  privateKey: string;

  /**
   * WhatsApp passphrase for private key
   */
  passphrase: string;

  /**
   * Welcome message for new users
   */
  welcomeMessage?: string;

  /**
   * Whether to enable onboarding for new users
   */
  enableOnboarding?: boolean;
}
