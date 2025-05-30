import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import {
  AppConfig,
  DatabaseConfig,
  WhatsAppConfig,
  EmailConfig,
  AIConfig,
  MediaConfig,
  AppConfiguration,
} from './interfaces';

/**
 * Centralized configuration service for the application
 */
@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly appConfig: AppConfig;
  private readonly databaseConfig: DatabaseConfig;
  private readonly whatsappConfig: WhatsAppConfig;
  private readonly emailConfig: EmailConfig;
  private readonly aiConfig: AIConfig;
  private readonly mediaConfig: MediaConfig;

  constructor(private readonly configService: NestConfigService) {
    // Initialize all configuration sections
    this.appConfig = this.initAppConfig();
    this.databaseConfig = this.initDatabaseConfig();
    this.whatsappConfig = this.initWhatsAppConfig();
    this.emailConfig = this.initEmailConfig();
    this.aiConfig = this.initAIConfig();
    this.mediaConfig = this.initMediaConfig();

    this.logger.log('Configuration service initialized successfully');
  }

  /**
   * Get the complete application configuration
   */
  getConfig(): AppConfiguration {
    return {
      app: this.appConfig,
      database: this.databaseConfig,
      whatsapp: this.whatsappConfig,
      email: this.emailConfig,
      ai: this.aiConfig,
      media: this.mediaConfig,
    };
  }

  /**
   * Get application configuration
   */
  getAppConfig(): AppConfig {
    return this.appConfig;
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig(): DatabaseConfig {
    return this.databaseConfig;
  }

  /**
   * Get WhatsApp configuration
   */
  getWhatsAppConfig(): WhatsAppConfig {
    return this.whatsappConfig;
  }

  /**
   * Get email configuration
   */
  getEmailConfig(): EmailConfig {
    return this.emailConfig;
  }

  /**
   * Get AI configuration
   */
  getAIConfig(): AIConfig {
    return this.aiConfig;
  }

  /**
   * Get media configuration
   */
  getMediaConfig(): MediaConfig {
    return this.mediaConfig;
  }

  /**
   * Check if the application is running in development mode
   */
  isDevelopment(): boolean {
    console.log("🚀 ~ ConfigService ~ isDevelopment ~ this.appConfig.nodeEnv:", this.appConfig.nodeEnv)
    return this.appConfig.nodeEnv === 'development';
  }

  /**
   * Check if the application is running in production mode
   */
  isProduction(): boolean {
    return this.appConfig.nodeEnv === 'production';
  }

  /**
   * Check if the application is running in test mode
   */
  isTest(): boolean {
    return this.appConfig.nodeEnv === 'test';
  }

  /**
   * Initialize application configuration
   */
  private initAppConfig(): AppConfig {
    return {
      frontendUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:3001',
      ),
      adminDashboardUrl: this.configService.get<string>(
        'ADMIN_DASHBOARD_URL',
        'http://localhost:3000',
      ),
      corsOrigin: this.configService.get<string>('CORS_ORIGIN', '*'),
      appUrl: this.configService.get<string>(
        'APP_URL',
        'http://localhost:9090',
      ),
      nodeEnv: this.configService.get<'development' | 'production' | 'test'>(
        'NODE_ENV',
        'development',
      ),
      port: parseInt(this.configService.get<string>('PORT', '3000'), 10),
      aiDebugMode: this.configService.get<boolean>('AI_DEBUG_MODE', false),
      jwtSecret: this.configService.get<string>('JWT_SECRET', 'tamy-ai-secret'),
    };
  }

  /**
   * Initialize database configuration
   */
  private initDatabaseConfig(): DatabaseConfig {
    return {
      redisUrl: this.configService.get<string>(
        'REDIS_URL',
        'redis://localhost:6379',
      ),
      weaviateUrl: this.configService.get<string>(
        'WEAVIATE_URL',
        'http://localhost:8080',
      ),
      databaseUrl: this.configService.get<string>(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:4500/tamy-ai',
      ),
    };
  }

  /**
   * Initialize WhatsApp configuration
   */
  private initWhatsAppConfig(): WhatsAppConfig {
    const isDev = this.isDevelopment();

    // Get API key from either WHATSAPP_API_KEY or WHATSAPP_ACCESS_TOKEN
    const apiKey =
      this.configService.get<string>('WHATSAPP_API_KEY') ||
      this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') ||
      (isDev ? 'dev_token' : '');

      console.log("🚀 ~ ConfigService ~ initWhatsAppConfig ~ apiKey:", apiKey)
    return {
      phoneNumberId: this.configService.get<string>(
        'WHATSAPP_PHONE_NUMBER_ID',
        isDev ? '123456789' : '',
      ),
      wabaId: this.configService.get<string>(
        'WHATSAPP_WABA_ID',
        isDev ? '123456789' : '',
      ),
      apiVersion: this.configService.get<string>(
        'WHATSAPP_API_VERSION',
        'v17.0',
      ),
      apiKey,
      verifyToken: this.configService.get<string>(
        'WHATSAPP_VERIFY_TOKEN',
        isDev ? 'dev_verify_token' : '',
      ),
      appSecret: this.configService.get<string>(
        'WHATSAPP_APP_SECRET',
        isDev ? 'dev_app_secret' : '',
      ),
      privateKey: this.configService.get<string>(
        'WHATSAPP_PRIVATE_KEY',
        isDev ? 'dev_private_key' : '',
      ),
      passphrase: this.configService.get<string>(
        'WHATSAPP_PASSPHRASE',
        isDev ? 'dev_passphrase' : '',
      ),
      welcomeMessage: this.configService.get<string>(
        'WHATSAPP_WELCOME_MESSAGE',
        "Welcome to Tamy Finance Assistant! I'm here to help you manage your finances and achieve your financial goals.",
      ),
      enableOnboarding: this.configService.get<boolean>(
        'WHATSAPP_ENABLE_ONBOARDING',
        true,
      ),
    };
  }

  /**
   * Initialize email configuration
   */
  private initEmailConfig(): EmailConfig {
    const isDev = this.isDevelopment();

    return {
      sendgridApiKey: this.configService.get<string>(
        'SENDGRID_API_KEY',
        isDev ? 'test_key' : '',
      ),
      emailFrom: this.configService.get<string>(
        'SENDGRID_EMAIL_FROM',
        isDev ? 'test@example.com' : '',
      ),
    };
  }

  /**
   * Initialize AI configuration
   */
  private initAIConfig(): AIConfig {
    const isDev = this.isDevelopment();

    return {
      openaiApiKey: this.configService.get<string>(
        'OPENAI_API_KEY',
        isDev ? 'sk-test' : '',
      ),
      anthropicApiKey: this.configService.get<string>(
        'ANTHROPIC_API_KEY',
        isDev ? 'sk-ant-test' : '',
      ),
      agentsCollaborationTimeout: parseInt(
        this.configService.get<string>(
          'AI_AGENTS_COLLABORATION_TIMEOUT',
          '30000',
        ),
        10,
      ),
      agentsToolsTimeout: parseInt(
        this.configService.get<string>('AI_AGENTS_TOOLS_TIMEOUT', '30000'),
        10,
      ),
    };
  }

  /**
   * Initialize media configuration
   */
  private initMediaConfig(): MediaConfig {
    return {
      maxFileSizeMb: parseInt(
        this.configService.get<string>('MAX_FILE_SIZE_MB', '10'),
        10,
      ),
      mediaStoragePath: this.configService.get<string>(
        'MEDIA_STORAGE_PATH',
        './media',
      ),
      allowedFileTypes: this.configService
        .get<string>('ALLOWED_FILE_TYPES', 'pdf,csv,jpg,jpeg,png,mp3,mp4,wav')
        .split(','),
    };
  }

  /**
   * Validate the configuration and log warnings for missing values
   * @returns Whether the configuration is valid
   */
  validateConfig(): boolean {
    let isValid = true;
    const isDev = this.isDevelopment();

    // Only validate required values in production mode
    if (!isDev) {
      // Validate WhatsApp configuration
      if (!this.whatsappConfig.phoneNumberId) {
        this.logger.warn(
          'WHATSAPP_PHONE_NUMBER_ID is not set - WhatsApp messaging will not work',
        );
        isValid = false;
      }

      if (!this.whatsappConfig.apiKey) {
        this.logger.warn(
          'Neither WHATSAPP_API_KEY nor WHATSAPP_ACCESS_TOKEN is set - WhatsApp messaging will not work',
        );
        isValid = false;
      }

      if (!this.whatsappConfig.verifyToken) {
        this.logger.warn(
          'WHATSAPP_VERIFY_TOKEN is not set - WhatsApp webhook verification will not work',
        );
        isValid = false;
      }

      // Validate AI configuration
      if (!this.aiConfig.openaiApiKey) {
        this.logger.warn(
          'OPENAI_API_KEY is not set - OpenAI features will not work',
        );
        isValid = false;
      }

      if (!this.aiConfig.anthropicApiKey) {
        this.logger.warn(
          'ANTHROPIC_API_KEY is not set - Anthropic features will not work',
        );
        isValid = false;
      }

      // Validate email configuration
      if (!this.emailConfig.sendgridApiKey) {
        this.logger.warn(
          'SENDGRID_API_KEY is not set - Email sending will not work',
        );
        isValid = false;
      }

      if (!this.emailConfig.emailFrom) {
        this.logger.warn(
          'SENDGRID_EMAIL_FROM is not set - Email sending will not work',
        );
        isValid = false;
      }

      // Validate database configuration
      if (!this.databaseConfig.databaseUrl) {
        this.logger.warn(
          'DATABASE_URL is not set - Database connection will not work',
        );
        isValid = false;
      }
    }

    return isValid || isDev;
  }
}
