import * as Joi from 'joi';

/**
 * Validation schema for environment variables
 */
export const validationSchema = Joi.object({
  // App configuration
  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:3000'),
  APP_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:9090'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(9090),
  AI_DEBUG_MODE: Joi.boolean().default(false),

  // Database configuration
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .default('redis://localhost:6379'),
  WEAVIATE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:8080'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql'] }) // Ensure it's a postgresql URI
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string()
        .uri({ scheme: ['postgresql'] })
        .default('postgresql://postgres:postgres@localhost:4500/tamy-ai'),
    }),

  // WhatsApp configuration
  WHATSAPP_PHONE_NUMBER_ID: Joi.string()
    .pattern(/^[0-9]+$/)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().required(),
      otherwise: Joi.string().default('123456789'),
    }),
  WHATSAPP_WABA_ID: Joi.string()
    .pattern(/^[0-9]+$/)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().required(),
      otherwise: Joi.string().default('123456789'),
    }),
  WHATSAPP_API_VERSION: Joi.string().default('v17.0'),
  WHATSAPP_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('dev_token'),
  }),
  // WHATSAPP_ACCESS_TOKEN: Joi.string(), // Removed - Use WHATSAPP_API_KEY
  WHATSAPP_VERIFY_TOKEN: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('dev_verify_token'),
  }),
  WHATSAPP_APP_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('dev_app_secret'),
  }),
  WHATSAPP_PRIVATE_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(), // Basic check, format can vary
    otherwise: Joi.string().default('dev_private_key'),
  }),
  WHATSAPP_PASSPHRASE: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('dev_passphrase'),
  }),
  WHATSAPP_WELCOME_MESSAGE: Joi.string().default(
    "Welcome to Tamy Finance Assistant! I'm here to help you manage your finances and achieve your financial goals.",
  ),
  WHATSAPP_ENABLE_ONBOARDING: Joi.boolean().default(true),

  // Email configuration
  SENDGRID_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('test_key'),
  }),
  SENDGRID_EMAIL_FROM: Joi.string()
    .email()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().email().required(),
      otherwise: Joi.string().email().default('test@example.com'),
    }),

  // AI configuration
  OPENAI_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(), // Basic check, format can vary
    otherwise: Joi.string().default('sk-test'),
  }),
  ANTHROPIC_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(), // Basic check, format can vary
    otherwise: Joi.string().default('sk-ant-test'),
  }),
  AI_AGENTS_COLLABORATION_TIMEOUT: Joi.number().positive().default(30000),
  AI_AGENTS_TOOLS_TIMEOUT: Joi.number().positive().default(30000),

  // Media configuration
  MAX_FILE_SIZE_MB: Joi.number().positive().default(10),
  MEDIA_STORAGE_PATH: Joi.string().default('./media'),
  ALLOWED_FILE_TYPES: Joi.string()
    .pattern(/^[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*$/) // Ensures comma-separated alphanumeric list
    .message(
      'ALLOWED_FILE_TYPES must be a comma-separated list of extensions (e.g., pdf,csv,jpg)',
    )
    .default('pdf,csv,jpg,jpeg,png,mp3,mp4,wav'),
});
