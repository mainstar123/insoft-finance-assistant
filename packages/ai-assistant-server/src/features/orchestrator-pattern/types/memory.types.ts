import { RegistrationSteps } from '.';
import { Embeddings } from '@langchain/core/embeddings';

export type MemoryType =
  | 'transaction'
  | 'preference'
  | 'conversation'
  | 'action'
  | 'registration_step'
  | 'routing_decision'
  | 'agent_interaction';

export interface FinancialMemory {
  type: MemoryType;
  content: string;
  metadata: {
    userId: string;
    timestamp: number;
    threadId?: string;
    category?: string;
    amount?: number;
    confidence?: number;
    source?: string;
    // Registration specific
    registrationStep?: RegistrationSteps;
    stepStatus?: 'started' | 'completed' | 'failed';
    // Routing specific
    fromNode?: string;
    toNode?: string;
    routingReason?: string;
    // Agent specific
    agentName?: string;
    interactionType?: 'input' | 'output' | 'error';
  };
}

export interface MemorySearchResult {
  memory: FinancialMemory;
  score: number;
}

export interface MemoryStore {
  // Store a new memory
  addMemory(memory: FinancialMemory): Promise<void>;

  // Search memories by semantic similarity
  searchMemories(
    query: string,
    options?: {
      type?: MemoryType;
      userId?: string;
      limit?: number;
      minScore?: number;
      category?: string;
      registrationStep?: RegistrationSteps;
      agentName?: string;
    },
  ): Promise<MemorySearchResult[]>;

  // Get all memories for a user
  getUserMemories(
    userId: string,
    type?: MemoryType,
  ): Promise<FinancialMemory[]>;

  // Delete memories by criteria
  deleteMemories(criteria: {
    userId?: string;
    type?: MemoryType;
    before?: number;
  }): Promise<void>;
}

export interface MemoryConfig {
  embeddings: Embeddings;
  namespace?: string;
  minScore?: number;
  maxResults?: number;
}
