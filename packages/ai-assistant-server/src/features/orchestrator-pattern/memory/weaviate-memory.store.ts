import { Injectable, Logger } from '@nestjs/common';
import { WeaviateService } from '@/core/integrations/weaviate/weaviate.service';
import { WeaviateSchema } from '@/core/integrations/weaviate/interfaces/weaviate.interface';
import {
  FinancialMemory,
  MemorySearchResult,
  MemoryStore,
} from '../types/memory.types';

export const FINANCIAL_MEMORY_CLASS_NAME = 'FinancialMemory';

export const FINANCIAL_MEMORY_SCHEMA: WeaviateSchema = {
  class: FINANCIAL_MEMORY_CLASS_NAME,
  description: 'Financial memory for registered users',
  vectorizer: 'text2vec-openai',
  moduleConfig: {
    'text2vec-openai': {
      model: 'text-embedding-3-small',
      modelVersion: '3',
      type: 'text',
    },
  },
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
          vectorizePropertyName: false,
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
};

@Injectable()
export class WeaviateMemoryStore implements MemoryStore {
  private readonly logger = new Logger(WeaviateMemoryStore.name);
  private initialized = false;

  constructor(private readonly weaviateService: WeaviateService) {}

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      const schemaExists = await this.weaviateService.hasSchema(
        FINANCIAL_MEMORY_CLASS_NAME,
      );
      if (!schemaExists) {
        await this.weaviateService.createSchema(
          FINANCIAL_MEMORY_CLASS_NAME,
          FINANCIAL_MEMORY_SCHEMA,
        );
        this.logger.log(
          `Created schema for class ${FINANCIAL_MEMORY_CLASS_NAME}`,
        );
      }
      this.initialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize WeaviateMemoryStore:', error);
      throw error;
    }
  }

  async addMemory(memory: FinancialMemory): Promise<void> {
    await this.ensureInitialized();
    try {
      const weaviateObject = {
        userId: memory.metadata.userId,
        threadId: memory.metadata.threadId,
        type: memory.type,
        content: memory.content,
        category: memory.metadata.category,
        amount: memory.metadata.amount,
        confidence: memory.metadata.confidence,
        source: memory.metadata.source,
        timestamp: memory.metadata.timestamp,
      };

      await this.weaviateService.addObject(
        FINANCIAL_MEMORY_CLASS_NAME,
        weaviateObject,
      );
    } catch (error) {
      this.logger.error('Failed to add memory:', error);
      throw error;
    }
  }

  async searchMemories(
    query: string,
    options: {
      type?: FinancialMemory['type'];
      userId?: string;
      limit?: number;
      minScore?: number;
    } = {},
  ): Promise<MemorySearchResult[]> {
    await this.ensureInitialized();
    try {
      const where: any = {};
      if (options.userId) {
        where.operator = 'And';
        where.operands = [
          { path: ['userId'], operator: 'Equal', valueString: options.userId },
        ];
        if (options.type) {
          where.operands.push({
            path: ['type'],
            operator: 'Equal',
            valueString: options.type,
          });
        }
      } else if (options.type) {
        where.path = ['type'];
        where.operator = 'Equal';
        where.valueString = options.type;
      }

      const results = await this.weaviateService.searchObjects(
        FINANCIAL_MEMORY_CLASS_NAME,
        query,
        {
          limit: options.limit || 10,
          nearText: { concepts: [query] },
          where: Object.keys(where).length > 0 ? where : undefined,
          fields: [
            'userId',
            'threadId',
            'type',
            'content',
            'category',
            'amount',
            'confidence',
            'source',
            'timestamp',
            '_additional { certainty }',
          ],
        },
      );

      return results
        .filter(
          (result) =>
            !options.minScore ||
            result._additional.certainty >= options.minScore,
        )
        .map((result) => ({
          memory: {
            type: result.type,
            content: result.content,
            metadata: {
              userId: result.userId,
              threadId: result.threadId,
              category: result.category,
              amount: result.amount,
              confidence: result.confidence,
              source: result.source,
              timestamp: new Date(result.timestamp).getTime(),
            },
          },
          score: result._additional.certainty,
        }));
    } catch (error) {
      this.logger.error('Failed to search memories:', error);
      throw error;
    }
  }

  async getUserMemories(
    userId: string,
    type?: FinancialMemory['type'],
  ): Promise<FinancialMemory[]> {
    await this.ensureInitialized();
    try {
      const where: any = {
        operator: 'And',
        operands: [
          { path: ['userId'], operator: 'Equal', valueString: userId },
        ],
      };

      if (type) {
        where.operands.push({
          path: ['type'],
          operator: 'Equal',
          valueString: type,
        });
      }

      const results = await this.weaviateService.searchObjects(
        FINANCIAL_MEMORY_CLASS_NAME,
        '',
        {
          where,
          fields: [
            'userId',
            'threadId',
            'type',
            'content',
            'category',
            'amount',
            'confidence',
            'source',
            'timestamp',
          ],
        },
      );

      return results.map((result) => ({
        type: result.type,
        content: result.content,
        metadata: {
          userId: result.userId,
          threadId: result.threadId,
          category: result.category,
          amount: result.amount,
          confidence: result.confidence,
          source: result.source,
          timestamp: new Date(result.timestamp).getTime(),
        },
      }));
    } catch (error) {
      this.logger.error('Failed to get user memories:', error);
      throw error;
    }
  }

  async deleteMemories(criteria: {
    userId?: string;
    type?: FinancialMemory['type'];
    before?: number;
  }): Promise<void> {
    await this.ensureInitialized();
    try {
      const where: any = {
        operator: 'And',
        operands: [],
      };

      if (criteria.userId) {
        where.operands.push({
          path: ['userId'],
          operator: 'Equal',
          valueString: criteria.userId,
        });
      }

      if (criteria.type) {
        where.operands.push({
          path: ['type'],
          operator: 'Equal',
          valueString: criteria.type,
        });
      }

      if (criteria.before) {
        where.operands.push({
          path: ['timestamp'],
          operator: 'LessThan',
          valueDate: new Date(criteria.before).toISOString(),
        });
      }

      if (where.operands.length === 0) {
        throw new Error('At least one deletion criterion must be specified');
      }

      await this.weaviateService.deleteObjects(
        FINANCIAL_MEMORY_CLASS_NAME,
        where,
      );
    } catch (error) {
      this.logger.error('Failed to delete memories:', error);
      throw error;
    }
  }
}
