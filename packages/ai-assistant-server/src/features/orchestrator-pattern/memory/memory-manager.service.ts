import { Injectable, Logger } from '@nestjs/common';
import { OpenAIEmbeddings } from '@langchain/openai';

import { SemanticMemoryStore } from './semantic-memory.store';
import { WeaviateMemoryStore } from './weaviate-memory.store';
import { WeaviateService } from '@/core/integrations/weaviate/weaviate.service';
import { MemoryStore, FinancialMemory } from '../types/memory.types';

@Injectable()
export class MemoryManagerService {
  private readonly logger = new Logger(MemoryManagerService.name);
  private readonly inMemoryStore: MemoryStore;
  private readonly weaviateStore: MemoryStore;

  constructor(private readonly weaviateService: WeaviateService) {
    // Initialize OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
    });

    // Initialize both stores
    this.inMemoryStore = new SemanticMemoryStore({
      embeddings,
      namespace: 'temp-memory',
      minScore: 0.7,
      maxResults: 10,
    });

    this.weaviateStore = new WeaviateMemoryStore(weaviateService);
  }

  private getStore(isRegistered: boolean): MemoryStore {
    return isRegistered ? this.weaviateStore : this.inMemoryStore;
  }

  async storeMemory(
    memory: FinancialMemory,
    isRegistered: boolean,
  ): Promise<void> {
    const store = this.getStore(isRegistered);
    await store.addMemory(memory);
  }

  async searchRelevantMemories(
    query: string,
    userId: string,
    isRegistered: boolean,
    type?: FinancialMemory['type'],
  ) {
    const store = this.getStore(isRegistered);
    return store.searchMemories(query, {
      userId,
      type,
      limit: 5, // Limit to most relevant memories
    });
  }

  async getContextForPrompt(
    userId: string,
    query: string,
    isRegistered: boolean,
  ): Promise<string> {
    const store = this.getStore(isRegistered);
    const relevantMemories = await store.searchMemories(query, {
      userId,
      limit: 3,
      minScore: 0.8,
    });

    if (relevantMemories.length === 0) {
      return '';
    }

    // Format memories into a context string
    const context = relevantMemories
      .map(({ memory }) => {
        const timestamp = new Date(memory.metadata.timestamp).toLocaleString();
        return `[${timestamp}] ${memory.type}: ${memory.content}`;
      })
      .join('\n');

    return `Relevant context from past interactions:\n${context}\n\n`;
  }

  async storeConversationMemory(
    userId: string,
    content: string,
    isRegistered: boolean,
    metadata: Partial<FinancialMemory['metadata']> = {},
  ): Promise<void> {
    const memory: FinancialMemory = {
      type: 'conversation',
      content,
      metadata: {
        userId,
        timestamp: Date.now(),
        ...metadata,
      },
    };

    await this.storeMemory(memory, isRegistered);
  }

  async storeFinancialAction(
    userId: string,
    action: string,
    isRegistered: boolean,
    amount?: number,
    category?: string,
  ): Promise<void> {
    const memory: FinancialMemory = {
      type: 'action',
      content: action,
      metadata: {
        userId,
        timestamp: Date.now(),
        amount,
        category,
      },
    };

    await this.storeMemory(memory, isRegistered);
  }

  async storeUserPreference(
    userId: string,
    preference: string,
    isRegistered: boolean,
    category?: string,
  ): Promise<void> {
    const memory: FinancialMemory = {
      type: 'preference',
      content: preference,
      metadata: {
        userId,
        timestamp: Date.now(),
        category,
      },
    };

    await this.storeMemory(memory, isRegistered);
  }

  async cleanupOldMemories(
    userId: string,
    beforeTimestamp: number,
    isRegistered: boolean,
    type?: FinancialMemory['type'],
  ): Promise<void> {
    const store = this.getStore(isRegistered);
    await store.deleteMemories({
      userId,
      type,
      before: beforeTimestamp,
    });
  }
}
