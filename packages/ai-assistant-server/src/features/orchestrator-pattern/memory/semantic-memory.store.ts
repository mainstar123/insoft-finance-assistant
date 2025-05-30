import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Embeddings } from '@langchain/core/embeddings';
import {
  FinancialMemory,
  MemoryConfig,
  MemorySearchResult,
  MemoryStore,
} from '../types/memory.types';

interface SemanticMemoryStoreConfig {
  embeddings: Embeddings;
  namespace: string;
  minScore?: number;
  maxResults?: number;
}

type SearchResult = [Document<Record<string, any>>, number];

export class SemanticMemoryStore implements MemoryStore {
  private readonly vectorStore: MemoryVectorStore;
  private readonly minScore: number;
  private readonly maxResults: number;

  constructor(config: SemanticMemoryStoreConfig) {
    this.vectorStore = new MemoryVectorStore(config.embeddings);
    this.minScore = config.minScore || 0.7;
    this.maxResults = config.maxResults || 10;
  }

  async addMemory(memory: FinancialMemory): Promise<void> {
    const doc = new Document({
      pageContent: memory.content,
      metadata: {
        userId: memory.metadata.userId,
        timestamp: memory.metadata.timestamp,
        threadId: memory.metadata.threadId,
        category: memory.metadata.category,
        amount: memory.metadata.amount,
        confidence: memory.metadata.confidence,
        source: memory.metadata.source,
        type: memory.type,
      },
    });

    await this.vectorStore.addDocuments([doc]);
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
    const filter = (doc: Document<Record<string, any>>) => {
      if (options.userId && doc.metadata.userId !== options.userId) {
        return false;
      }
      if (options.type && doc.metadata.type !== options.type) {
        return false;
      }
      return true;
    };

    const results = await this.vectorStore.similaritySearchWithScore(
      query,
      options.limit || this.maxResults,
      filter,
    );

    return results
      .filter(
        ([, score]: SearchResult) =>
          score >= (options.minScore || this.minScore),
      )
      .map(([doc, score]: SearchResult) => ({
        memory: {
          type: doc.metadata.type,
          content: doc.pageContent,
          metadata: {
            userId: doc.metadata.userId,
            timestamp: doc.metadata.timestamp,
            threadId: doc.metadata.threadId,
            category: doc.metadata.category,
            amount: doc.metadata.amount,
            confidence: doc.metadata.confidence,
            source: doc.metadata.source,
          },
        },
        score,
      }));
  }

  async getUserMemories(
    userId: string,
    type?: FinancialMemory['type'],
  ): Promise<FinancialMemory[]> {
    const filter = (doc: Document<Record<string, any>>) => {
      if (doc.metadata.userId !== userId) {
        return false;
      }
      if (type && doc.metadata.type !== type) {
        return false;
      }
      return true;
    };

    const results = await this.vectorStore.similaritySearch(
      '',
      this.maxResults,
      filter,
    );

    return results.map((doc: Document<Record<string, any>>) => ({
      type: doc.metadata.type,
      content: doc.pageContent,
      metadata: {
        userId: doc.metadata.userId,
        timestamp: doc.metadata.timestamp,
        threadId: doc.metadata.threadId,
        category: doc.metadata.category,
        amount: doc.metadata.amount,
        confidence: doc.metadata.confidence,
        source: doc.metadata.source,
      },
    }));
  }

  async deleteMemories(criteria: {
    userId?: string;
    type?: FinancialMemory['type'];
    before?: number;
  }): Promise<void> {
    // Implementation depends on the vector store's delete capabilities
    throw new Error('Delete operation not supported in semantic memory store');
  }
}
