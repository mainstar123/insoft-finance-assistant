import { AIConfig } from './ai-config.interface';
import { AppConfig } from './app-config.interface';
import { DatabaseConfig } from './database-config.interface';
import { EmailConfig } from './email-config.interface';
import { MediaConfig } from './media-config.interface';
import { WhatsAppConfig } from './whatsapp-config.interface';

export * from './app-config.interface';
export * from './database-config.interface';
export * from './whatsapp-config.interface';
export * from './email-config.interface';
export * from './ai-config.interface';
export * from './media-config.interface';

/**
 * Complete application configuration interface
 */
export interface AppConfiguration {
  app: AppConfig;
  database: DatabaseConfig;
  whatsapp: WhatsAppConfig;
  email: EmailConfig;
  ai: AIConfig;
  media: MediaConfig;
}
