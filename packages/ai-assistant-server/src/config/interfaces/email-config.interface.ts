/**
 * Email configuration interface
 */
export interface EmailConfig {
  /**
   * SendGrid API key
   */
  sendgridApiKey: string;

  /**
   * Email address to send from
   */
  emailFrom: string;
}
