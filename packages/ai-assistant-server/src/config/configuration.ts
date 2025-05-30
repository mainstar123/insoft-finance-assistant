/**
 * Validates the application configuration
 * Throws an error if required configuration is missing
 */
export function validateConfig() {
  const requiredVariables = [
    // OpenAI configuration
    'OPENAI_API_KEY',

    // WhatsApp configuration
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_API_KEY',
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN',

    // Database configuration
    'DATABASE_URL',

    // Server configuration
    'PORT',
    'NODE_ENV',
  ];

  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable],
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(', ')}`,
    );
  }

  // Validate OpenAI API key format
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey && !openaiApiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY must start with "sk-"');
  }

  // Validate PORT is a number
  const port = process.env.PORT;
  if (port && isNaN(Number(port))) {
    throw new Error('PORT must be a number');
  }

  // Validate NODE_ENV is a valid environment
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, production, test');
  }

  // Validate DATABASE_URL format
  const databaseUrl = process.env.DATABASE_URL;
  if (
    databaseUrl &&
    !databaseUrl.startsWith('postgresql://') &&
    !databaseUrl.startsWith('mysql://')
  ) {
    throw new Error('DATABASE_URL must be a valid database connection string');
  }

  console.log('✅ Configuration validation passed');
}
