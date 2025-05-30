/**
 * Script to initialize all Weaviate schemas used in the application
 * This creates the class structures without adding any data
 */
import { ConfigService } from '@nestjs/config';
import { WeaviateService } from '../weaviate.service';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WeaviateSchema } from '../interfaces/weaviate.interface';

// Import weaviate properly
const weaviate = require('weaviate-ts-client');

// Update moduleConfig for all schemas to use text2vec-openai with proper configuration
const OPENAI_MODEL_CONFIG = {
  'text2vec-openai': {
    model: 'ada',
  },
};

// List of classes to initialize with their schemas
const SCHEMA_DEFINITIONS: Record<string, WeaviateSchema> = {
  // Class used by multi-agents memory module
  FinancialMemory: {
    class: 'FinancialMemory',
    description: 'Financial memory for registered users',
    vectorizer: 'text2vec-openai',
    moduleConfig: OPENAI_MODEL_CONFIG,
    properties: [
      {
        name: 'userId',
        description: 'The ID of the user who owns this memory',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'threadId',
        description: 'The conversation thread ID',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'type',
        description: 'The type of financial memory',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'content',
        description: 'The content of the memory',
        dataType: ['text'],
        moduleConfig: {
          'text2vec-openai': {
            skip: false,
          },
        },
      },
      {
        name: 'category',
        description: 'The financial category',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'amount',
        description: 'The financial amount',
        dataType: ['number'],
        indexInverted: true,
      },
      {
        name: 'confidence',
        description: 'Confidence score of the memory',
        dataType: ['number'],
        indexInverted: true,
      },
      {
        name: 'source',
        description: 'Source of the memory',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'timestamp',
        description: 'When the memory was created',
        dataType: ['date'],
        indexInverted: true,
      },
    ],
  },

  // Conversation history for vector search
  ConversationHistory: {
    class: 'ConversationHistory',
    description: 'User conversation history for context retrieval',
    vectorizer: 'text2vec-openai',
    moduleConfig: OPENAI_MODEL_CONFIG,
    properties: [
      {
        name: 'threadId',
        description: 'The conversation thread ID',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'messages',
        description: 'JSON string of conversation messages',
        dataType: ['text'],
      },
      {
        name: 'intent',
        description: 'The conversation intent or topic',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'timestamp',
        description: 'When the conversation occurred',
        dataType: ['date'],
        indexInverted: true,
      },
    ],
  },

  // Financial transactions for vector search
  FinancialTransaction: {
    class: 'FinancialTransaction',
    description: 'User financial transactions',
    vectorizer: 'text2vec-openai',
    moduleConfig: OPENAI_MODEL_CONFIG,
    properties: [
      {
        name: 'userPhone',
        description: 'User phone number',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'amount',
        description: 'Transaction amount',
        dataType: ['number'],
        indexInverted: true,
      },
      {
        name: 'category',
        description: 'Transaction category',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'subcategory',
        description: 'Transaction subcategory',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'description',
        description: 'Transaction description',
        dataType: ['text'],
      },
      {
        name: 'timestamp',
        description: 'Transaction timestamp',
        dataType: ['date'],
        indexInverted: true,
      },
    ],
  },

  // Budget goals for vector search
  BudgetGoal: {
    class: 'BudgetGoal',
    description: 'User budget goals',
    vectorizer: 'text2vec-openai',
    moduleConfig: OPENAI_MODEL_CONFIG,
    properties: [
      {
        name: 'userPhone',
        description: 'User phone number',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'category',
        description: 'Budget category',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'targetAmount',
        description: 'Goal target amount',
        dataType: ['number'],
        indexInverted: true,
      },
      {
        name: 'currentAmount',
        description: 'Current progress amount',
        dataType: ['number'],
        indexInverted: true,
      },
      {
        name: 'deadline',
        description: 'Goal deadline',
        dataType: ['date'],
        indexInverted: true,
      },
    ],
  },

  // Financial insights for vector search
  FinancialInsight: {
    class: 'FinancialInsight',
    description: 'Generated financial insights',
    vectorizer: 'text2vec-openai',
    moduleConfig: OPENAI_MODEL_CONFIG,
    properties: [
      {
        name: 'userPhone',
        description: 'User phone number',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'type',
        description: 'Insight type',
        dataType: ['string'],
        indexInverted: true,
      },
      {
        name: 'content',
        description: 'Insight content',
        dataType: ['text'],
      },
      {
        name: 'timestamp',
        description: 'When the insight was generated',
        dataType: ['date'],
        indexInverted: true,
      },
    ],
  },
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),
  ],
  providers: [ConfigService, WeaviateService],
})
class AppModule {}

/**
 * Function to create schema with a fallback vectorizer
 * Will try text2vec-openai first, then fall back to 'none' if not available
 */
async function createSchemaWithFallback(
  weaviateService: any,
  className: string,
  schema: any,
) {
  try {
    console.log(
      `🔨 Attempting to create schema for ${className} with text2vec-openai...`,
    );
    await weaviateService.createSchema(className, schema);
    console.log(`✅ Successfully created schema for ${className}`);
    return true;
  } catch (error: unknown) {
    // Check if the error is because text2vec-openai is not available
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes('no module with name "text2vec-openai" present')
    ) {
      console.log(
        `⚠️ text2vec-openai module not available, trying with fallback vectorizer 'none'`,
      );

      // Clone schema and replace vectorizer with 'none'
      const fallbackSchema = { ...schema };
      fallbackSchema.vectorizer = 'none';
      delete fallbackSchema.moduleConfig['text2vec-openai'];

      // For properties, remove text2vec-openai specific configs
      for (const prop of fallbackSchema.properties) {
        if (prop.moduleConfig && prop.moduleConfig['text2vec-openai']) {
          delete prop.moduleConfig['text2vec-openai'];
        }
      }

      try {
        await weaviateService.createSchema(className, fallbackSchema);
        console.log(
          `✅ Successfully created schema for ${className} with vectorizer 'none'`,
        );
        console.log(
          `⚠️ Note: You'll need to add vectors manually or configure a vectorizer later`,
        );
        return true;
      } catch (fallbackError: unknown) {
        const fallbackErrorMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        console.error(
          `❌ Failed to create schema with fallback vectorizer: ${fallbackErrorMessage}`,
        );
        return false;
      }
    } else {
      // If it's some other error, just propagate it
      throw error;
    }
  }
}

/**
 * Get available modules from Weaviate
 * This is a basic implementation since WeaviateService doesn't expose this directly
 */
async function getWeaviateModules(
  weaviateService: WeaviateService,
): Promise<string[]> {
  try {
    // Use axios directly to make an HTTP call to meta endpoint
    const axios = require('axios');
    const weaviateUrl = process.env.WEAVIATE_URL || 'http://localhost:8080';
    const response = await axios.get(`${weaviateUrl}/v1/meta`);
    const modules = response.data?.modules || {};
    return Object.keys(modules);
  } catch (error) {
    console.error('Failed to get available modules:', error);
    return [];
  }
}

/**
 * Print helpful setup instructions for Weaviate
 */
function printSetupInstructions() {
  console.log('\n🔧 Setup Instructions for Weaviate with Ollama Embeddings:');
  console.log('------------------------------------------------------');
  console.log(
    'Your Weaviate instance does not have the text2vec-openai module enabled.',
  );
  console.log(
    'To properly use vector search with Ollama embeddings, you need to:',
  );
  console.log('\n1. Update your docker-compose.yml with:');
  console.log('```yaml');
  console.log('services:');
  console.log('  weaviate:');
  console.log('    # ...existing configuration');
  console.log('    environment:');
  console.log('      # ...other environment variables');
  console.log('      ENABLE_MODULES: text2vec-openai,generative-ollama');
  console.log('```');
  console.log(
    '\n2. Make sure Ollama is running with the required embedding models:',
  );
  console.log('   - Start Ollama: `ollama serve`');
  console.log('   - Pull the embedding model: `ollama pull nomic-embed-text`');
  console.log(
    '\n3. After updating the configuration, restart your Weaviate container',
  );
  console.log('4. Run this initialization script again');
  console.log(
    '\nMore information: https://weaviate.io/blog/hybrid-search-with-ollama',
  );
}

async function bootstrap() {
  console.log('🚀 Starting Weaviate schema initialization...');

  try {
    // Create a minimal app context
    const app = await NestFactory.createApplicationContext(AppModule);
    const weaviateService = app.get(WeaviateService);

    // Ensure Weaviate is initialized
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if Ollama module is available
    console.log('🔍 Checking available Weaviate modules...');
    let openaiModuleAvailable = false;
    try {
      const modules = await getWeaviateModules(weaviateService);
      if (modules.length > 0) {
        console.log(`📊 Available modules: ${modules.join(', ')}`);
        openaiModuleAvailable = modules.includes('text2vec-openai');
      }

      if (!openaiModuleAvailable) {
        console.warn(
          '⚠️ The text2vec-openai module is not available in your Weaviate instance.',
        );
        console.warn(
          '⚠️ Schemas will be created with the "none" vectorizer as a fallback.',
        );
        console.warn(
          '⚠️ To use OpenAI embeddings, configure Weaviate with the text2vec-openai module.',
        );
        printSetupInstructions();
      }
    } catch (error) {
      console.warn(
        '⚠️ Could not check available modules, will try schemas with fallbacks if needed',
      );
    }

    // Initialize each class
    for (const [className, schema] of Object.entries(SCHEMA_DEFINITIONS)) {
      try {
        console.log(`📊 Checking class: ${className}`);

        // Check if class exists first
        const exists = await weaviateService.hasSchema(className);

        if (exists) {
          console.log(`✅ Class ${className} already exists in Weaviate`);
        } else {
          await createSchemaWithFallback(weaviateService, className, schema);
        }
      } catch (error) {
        console.error(`❌ Error setting up class ${className}:`, error);
      }
    }

    console.log('🎉 Weaviate schema initialization completed successfully');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize Weaviate schemas:', error);
    process.exit(1);
  }
}

bootstrap();
