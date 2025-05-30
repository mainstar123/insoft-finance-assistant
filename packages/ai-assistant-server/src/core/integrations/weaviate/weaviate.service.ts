// src/integrations/weaviate/weaviate.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';

// Types for our data models
export interface ConversationHistoryData {
  threadId: string;
  messages: any[];
  intent: string;
  timestamp: Date;
}

export interface FinancialTransactionData {
  userPhone: string;
  amount: number;
  category: string;
  subcategory: string;
  description: string;
  timestamp: Date;
}

export interface BudgetGoalData {
  userPhone: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
}

export interface FinancialInsightData {
  userPhone: string;
  type: string;
  content: string;
  timestamp: Date;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  distance?: number;
  autoLimit?: number;
  returnProperties?: string[];
  returnMetadata?: { distance: boolean };
}

@Injectable()
export class WeaviateService {
  private client!: WeaviateClient;
  private readonly logger = new Logger(WeaviateService.name);
  private initializationPromise: Promise<void>;

  constructor(private readonly configService: ConfigService) {
    this.initializationPromise = this.initializeClient();
  }

  private async ensureInitialized(): Promise<void> {
    await this.initializationPromise;
  }

  private async initializeClient(): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (openAiApiKey) {
        headers['X-OpenAI-Api-Key'] = openAiApiKey;
      }

      // Parse the WEAVIATE_URL to get scheme and host
      const weaviateUrl = new URL(
        this.configService.get<string>('WEAVIATE_URL') ||
          'http://localhost:8080',
      );

      this.client = weaviate.client({
        scheme: weaviateUrl.protocol.replace(':', ''),
        host: weaviateUrl.host,
        headers,
      });

      // Test the connection
      try {
        await this.client.misc.readyChecker().do();
        this.logger.log('Successfully connected to Weaviate');
      } catch (error) {
        const err = error as Error;
        this.logger.error(`Failed to connect to Weaviate: ${err.message}`);
        throw err;
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to initialize Weaviate client: ${err.message}`,
        err.stack,
      );
      throw new Error(`Failed to initialize Weaviate client: ${err.message}`);
    }
  }

  // Vector similarity search methods
  async searchSimilarConversations(
    query: string,
    options: SearchOptions = {},
  ): Promise<any[]> {
    await this.ensureInitialized();
    try {
      const result = await this.client.graphql
        .get()
        .withClassName('ConversationHistory')
        .withNearText({ concepts: [query] })
        .withLimit(options.limit || 10)
        .withFields(
          `
          threadId
          messages
          intent
          timestamp
          _additional {
            ${options.returnMetadata?.distance ? 'distance' : ''}
          }
        `,
        )
        .do();

      return result.data.Get.ConversationHistory || [];
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error searching similar conversations: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  async searchSimilarTransactions(
    query: string,
    options: SearchOptions = {},
  ): Promise<any[]> {
    await this.ensureInitialized();
    try {
      const result = await this.client.graphql
        .get()
        .withClassName('FinancialTransaction')
        .withNearText({ concepts: [query] })
        .withLimit(options.limit || 10)
        .withFields(
          `
          userPhone
          amount
          category
          description
          timestamp
          _additional {
            ${options.returnMetadata?.distance ? 'distance' : ''}
          }
        `,
        )
        .do();

      return result.data.Get.FinancialTransaction || [];
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error searching similar transactions: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  // BM25 search methods
  async queryConversationHistory(query: string): Promise<any[]> {
    await this.ensureInitialized();
    try {
      const result = await this.client.graphql
        .get()
        .withClassName('ConversationHistory')
        .withBm25({ query })
        .withFields(
          `
          threadId
          messages
          intent
          timestamp
        `,
        )
        .do();

      return result.data.Get.ConversationHistory || [];
    } catch (error) {
      this.logger.error('Error querying conversation history', error);
      throw error;
    }
  }

  async saveConversationHistory(data: ConversationHistoryData): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.client.data
        .creator()
        .withClassName('ConversationHistory')
        .withProperties({
          threadId: data.threadId,
          messages: JSON.stringify(data.messages),
          intent: data.intent,
          timestamp: data.timestamp.toISOString(),
        })
        .do();

      this.logger.debug(
        `Saved conversation history for thread ${data.threadId}`,
      );
    } catch (error) {
      this.logger.error('Error saving conversation history', error);
      throw error;
    }
  }

  async deleteConversationHistory(threadId: string): Promise<number> {
    await this.ensureInitialized();
    try {
      const result = await this.client.graphql
        .get()
        .withClassName('ConversationHistory')
        .withFields('_additional { id }')
        .withWhere({
          path: ['threadId'],
          operator: 'Equal',
          valueString: threadId,
        })
        .do();

      if (
        !result.data.Get.ConversationHistory ||
        result.data.Get.ConversationHistory.length === 0
      ) {
        this.logger.debug(
          `No conversation history found for thread ${threadId}`,
        );
        return 0;
      }

      const objectIds = result.data.Get.ConversationHistory.map(
        (obj: any) => obj._additional.id,
      );

      // Delete objects one by one since batch operations are not supported in newer versions
      for (const id of objectIds) {
        await this.client.data
          .deleter()
          .withClassName('ConversationHistory')
          .withId(id)
          .do();
      }

      this.logger.debug(
        `Deleted ${objectIds.length} conversation history records for thread ${threadId}`,
      );

      return objectIds.length;
    } catch (error) {
      this.logger.error(
        `Error deleting conversation history for thread ${threadId}`,
        error,
      );
      throw error;
    }
  }

  // New methods for schema operations
  async hasSchema(className: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const schema = await this.client.schema.getter().do();
      return schema.classes?.some((c) => c.class === className) ?? false;
    } catch (error) {
      this.logger.error(`Error checking schema existence: ${error}`);
      throw error;
    }
  }

  async createSchema(className: string, schema: any): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.client.schema.classCreator().withClass(schema).do();
      this.logger.log(`Created schema for class ${className}`);
    } catch (error) {
      this.logger.error(`Error creating schema: ${error}`);
      throw error;
    }
  }

  // New methods for data operations
  async addObject(
    className: string,
    properties: Record<string, any>,
  ): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.client.data
        .creator()
        .withClassName(className)
        .withProperties(properties)
        .do();
    } catch (error) {
      this.logger.error(`Error adding object: ${error}`);
      throw error;
    }
  }

  async searchObjects(
    className: string,
    query: string,
    options: {
      limit?: number;
      offset?: number;
      fields?: string[];
      where?: any;
      nearText?: { concepts: string[] };
    } = {},
  ): Promise<any[]> {
    await this.ensureInitialized();
    try {
      const graphQLQuery = this.client.graphql
        .get()
        .withClassName(className)
        .withLimit(options.limit || 10);

      if (options.nearText) {
        graphQLQuery.withNearText(options.nearText);
      }

      if (options.where) {
        graphQLQuery.withWhere(options.where);
      }

      if (options.fields) {
        graphQLQuery.withFields(options.fields.join('\n'));
      }

      const result = await graphQLQuery.do();
      return result.data.Get[className] || [];
    } catch (error) {
      this.logger.error(`Error searching objects: ${error}`);
      throw error;
    }
  }

  async deleteObjects(className: string, where: any): Promise<void> {
    await this.ensureInitialized();
    try {
      const objects = await this.searchObjects(className, '', {
        where,
        fields: ['_additional { id }'],
      });

      for (const obj of objects) {
        await this.client.data
          .deleter()
          .withClassName(className)
          .withId(obj._additional.id)
          .do();
      }
    } catch (error) {
      this.logger.error(`Error deleting objects: ${error}`);
      throw error;
    }
  }

  /**
   * Deletes an entire schema class including all objects within it
   * This is more efficient than deleting objects individually
   * @param className The name of the class to delete
   */
  async deleteSchemaClass(className: string): Promise<void> {
    await this.ensureInitialized();
    try {
      await this.client.schema.classDeleter().withClassName(className).do();
      this.logger.log(`Deleted schema class ${className}`);
    } catch (error) {
      this.logger.error(`Error deleting schema class ${className}: ${error}`);
      throw error;
    }
  }
}
