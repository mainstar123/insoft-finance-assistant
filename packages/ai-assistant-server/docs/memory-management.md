# Memory Management in Tamy's Multi-Agent System

This document provides a detailed explanation of the memory management approach used in Tamy Finance Assistant's multi-agent system, focusing on how context is maintained across conversations.

## Overview

Memory management is a critical component of our multi-agent system, as it enables the system to maintain context across multiple interactions with the user. This context includes conversation history, user preferences, financial data, and other relevant information that helps the system provide personalized and contextually relevant responses.

## Types of Memory

Our multi-agent system uses several types of memory:

### Short-Term Memory

Short-term memory includes information that is relevant to the current conversation session. This includes:

1. **Conversation History**: The recent messages exchanged between the user and the system
2. **Current Session State**: The state of the current conversation, including any in-progress tasks or workflows
3. **Temporary Calculations**: Intermediate results that are needed for the current conversation

Short-term memory is primarily managed through the state management system described in the [State Management](./state-management.md) document.

### Long-Term Memory

Long-term memory includes information that persists across multiple conversation sessions. This includes:

1. **User Profile**: Information about the user, including preferences, financial goals, and demographic data
2. **Financial Data**: Budget information, transaction history, goals, and insights
3. **Interaction History**: Patterns and insights derived from past interactions with the user

Long-term memory is stored in our persistence layer and is retrieved as needed to provide context for new conversations.

### Episodic Memory

Episodic memory refers to specific past interactions or events that may be relevant to the current conversation. This includes:

1. **Past Conversations**: Previous conversations about similar topics
2. **Financial Events**: Significant financial events or decisions
3. **User Feedback**: Past feedback or preferences expressed by the user

Episodic memory helps the system recall specific interactions and provide more contextually relevant responses.

## Memory Implementation

### Memory Manager

The `MemoryManager` class is responsible for managing memory across the multi-agent system:

```typescript
@Injectable()
export class MemoryManager {
  private readonly logger = new Logger(MemoryManager.name);

  constructor(
    private readonly persistenceProvider: PersistenceProvider,
  ) {}

  async getConversationMemory(userId: string, conversationId: string): Promise<ConversationMemory> {
    try {
      // Retrieve the conversation memory from the persistence layer
      const memory = await this.persistenceProvider.getConversationMemory(userId, conversationId);

      // If no memory exists, create a new one
      if (!memory) {
        return this.createNewConversationMemory(userId, conversationId);
      }

      return memory;
    } catch (error) {
      this.logger.error(`Error retrieving conversation memory: ${error.message}`, error.stack);
      // Return a new memory if retrieval fails
      return this.createNewConversationMemory(userId, conversationId);
    }
  }

  async saveConversationMemory(userId: string, conversationId: string, memory: ConversationMemory): Promise<void> {
    try {
      await this.persistenceProvider.saveConversationMemory(userId, conversationId, memory);
    } catch (error) {
      this.logger.error(`Error saving conversation memory: ${error.message}`, error.stack);
      throw error;
    }
  }

  private createNewConversationMemory(userId: string, conversationId: string): ConversationMemory {
    return {
      userId,
      conversationId,
      messages: [],
      userInfo: { userId },
      budget: [],
      transactions: [],
      goals: [],
      insights: [],
      lastUpdated: new Date(),
    };
  }

  async updateConversationMemory(userId: string, conversationId: string, state: AgentStateType): Promise<void> {
    try {
      // Get the existing memory
      const memory = await this.getConversationMemory(userId, conversationId);

      // Update the memory with the new state
      const updatedMemory = this.mergeStateIntoMemory(memory, state);

      // Save the updated memory
      await this.saveConversationMemory(userId, conversationId, updatedMemory);
    } catch (error) {
      this.logger.error(`Error updating conversation memory: ${error.message}`, error.stack);
      throw error;
    }
  }

  private mergeStateIntoMemory(memory: ConversationMemory, state: AgentStateType): ConversationMemory {
    // Merge the state into the memory
    return {
      ...memory,
      messages: [...memory.messages, ...state.messages],
      userInfo: { ...memory.userInfo, ...state.userInfo },
      budget: [...memory.budget, ...(state.budget || [])],
      transactions: [...memory.transactions, ...(state.transactions || [])],
      goals: [...memory.goals, ...(state.goals || [])],
      insights: [...memory.insights, ...(state.insights || [])],
      lastUpdated: new Date(),
    };
  }

  async getRelevantMemory(userId: string, query: string): Promise<RelevantMemory> {
    try {
      // Retrieve relevant memory based on the query
      const relevantMemory = await this.persistenceProvider.getRelevantMemory(userId, query);

      return relevantMemory;
    } catch (error) {
      this.logger.error(`Error retrieving relevant memory: ${error.message}`, error.stack);
      return { conversations: [], financialData: {} };
    }
  }
}
```

### Memory Integration with LangGraph

The memory manager is integrated with the LangGraph orchestrator to maintain context across conversations:

```typescript
@Injectable()
export class LangGraphOrchestratorService {
  private readonly logger = new Logger(LangGraphOrchestratorService.name);
  private graph: StateGraph<typeof AgentState.State>;

  constructor(
    private readonly supervisorAgent: SupervisorAgent,
    private readonly budgetAgent: BudgetAgent,
    private readonly transactionAgent: TransactionAgent,
    private readonly goalsAgent: GoalsAgent,
    private readonly insightsAgent: InsightsAgent,
    private readonly educationAgent: EducationAgent,
    private readonly memoryManager: MemoryManager,
    private readonly persistenceProvider: PersistenceProvider,
  ) {
    this.initializeGraph();
  }

  // ... other methods ...

  async processMessage(userId: string, conversationId: string, message: string): Promise<ProcessMessageResult> {
    try {
      // Get the conversation memory
      const memory = await this.memoryManager.getConversationMemory(userId, conversationId);

      // Prepare the initial state
      const initialState = this.prepareInitialState(memory, message);

      // Invoke the graph
      const result = await this.graph.invoke(initialState);

      // Update the conversation memory
      await this.memoryManager.updateConversationMemory(userId, conversationId, result);

      // Prepare the result
      return this.prepareResult(result);
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
      throw error;
    }
  }

  private prepareInitialState(memory: ConversationMemory, message: string): AgentStateType {
    // Prepare the initial state from the memory and the new message
    return {
      messages: [
        ...memory.messages,
        {
          role: 'user',
          content: message,
        },
      ],
      userInfo: memory.userInfo,
      budget: memory.budget,
      transactions: memory.transactions,
      goals: memory.goals,
      insights: memory.insights,
      routing: {},
    };
  }
}
```

## Memory Persistence

### Persistence Provider

The `PersistenceProvider` interface defines the methods for storing and retrieving memory:

```typescript
export interface PersistenceProvider {
  getConversationMemory(userId: string, conversationId: string): Promise<ConversationMemory | null>;
  saveConversationMemory(userId: string, conversationId: string, memory: ConversationMemory): Promise<void>;
  getRelevantMemory(userId: string, query: string): Promise<RelevantMemory>;
  saveState(conversationId: string, state: AgentStateType): Promise<void>;
  loadState(conversationId: string): Promise<AgentStateType | null>;
}
```

### Database Implementation

Our implementation uses a database to store and retrieve memory:

```typescript
@Injectable()
export class DatabasePersistenceProvider implements PersistenceProvider {
  private readonly logger = new Logger(DatabasePersistenceProvider.name);

  constructor(
    @InjectRepository(ConversationMemoryEntity)
    private readonly conversationMemoryRepository: Repository<ConversationMemoryEntity>,
    @InjectRepository(StateEntity)
    private readonly stateRepository: Repository<StateEntity>,
  ) {}

  async getConversationMemory(userId: string, conversationId: string): Promise<ConversationMemory | null> {
    try {
      const entity = await this.conversationMemoryRepository.findOne({
        where: { userId, conversationId },
      });

      if (!entity) {
        return null;
      }

      return JSON.parse(entity.data);
    } catch (error) {
      this.logger.error(`Error retrieving conversation memory: ${error.message}`, error.stack);
      return null;
    }
  }

  async saveConversationMemory(userId: string, conversationId: string, memory: ConversationMemory): Promise<void> {
    try {
      const entity = await this.conversationMemoryRepository.findOne({
        where: { userId, conversationId },
      });

      if (entity) {
        entity.data = JSON.stringify(memory);
        entity.updatedAt = new Date();
        await this.conversationMemoryRepository.save(entity);
      } else {
        const newEntity = new ConversationMemoryEntity();
        newEntity.userId = userId;
        newEntity.conversationId = conversationId;
        newEntity.data = JSON.stringify(memory);
        await this.conversationMemoryRepository.save(newEntity);
      }
    } catch (error) {
      this.logger.error(`Error saving conversation memory: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ... other methods ...
}
```

## Memory Optimization

To optimize memory usage and retrieval, we implement several strategies:

### Message Summarization

For long conversations, we summarize older messages to reduce memory usage while preserving context:

```typescript
async summarizeMessages(messages: Message[]): Promise<Message[]> {
  if (messages.length <= MAX_MESSAGES_WITHOUT_SUMMARIZATION) {
    return messages;
  }

  // Keep the most recent messages as is
  const recentMessages = messages.slice(-MAX_RECENT_MESSAGES);

  // Summarize older messages
  const olderMessages = messages.slice(0, -MAX_RECENT_MESSAGES);
  const summary = await this.summarizationService.summarize(olderMessages);

  // Return the summary and recent messages
  return [
    {
      role: 'system',
      content: `Previous conversation summary: ${summary}`,
    },
    ...recentMessages,
  ];
}
```

### Relevance Filtering

When retrieving memory, we filter for relevance to the current conversation:

```typescript
async getRelevantMemory(userId: string, query: string): Promise<RelevantMemory> {
  // Get all memory for the user
  const allMemory = await this.getAllUserMemory(userId);

  // Use vector similarity to find relevant conversations
  const relevantConversations = await this.vectorStore.similaritySearch(
    query,
    MAX_RELEVANT_CONVERSATIONS,
    { userId },
  );

  // Extract relevant financial data
  const relevantFinancialData = this.extractRelevantFinancialData(allMemory, query);

  return {
    conversations: relevantConversations,
    financialData: relevantFinancialData,
  };
}
```

### Memory Pruning

To prevent memory from growing indefinitely, we implement pruning strategies:

```typescript
async pruneOldMemory(): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MEMORY_RETENTION_DAYS);

  await this.conversationMemoryRepository.delete({
    updatedAt: LessThan(cutoffDate),
  });
}
```

## Context Window Management

To ensure that we don't exceed the context window of the language model, we implement context window management:

```typescript
prepareContextForLLM(memory: ConversationMemory, query: string): string {
  // Calculate the current context size
  const currentContextSize = this.calculateContextSize(memory);

  // If we're approaching the limit, summarize and prune
  if (currentContextSize > MAX_CONTEXT_SIZE * 0.8) {
    memory = this.pruneContext(memory);
  }

  // Format the context for the LLM
  return this.formatContextForLLM(memory, query);
}

calculateContextSize(memory: ConversationMemory): number {
  // Calculate the size of the memory in tokens
  let size = 0;

  // Add message sizes
  for (const message of memory.messages) {
    size += message.content.length / AVERAGE_CHARS_PER_TOKEN;
  }

  // Add other memory components
  size += JSON.stringify(memory.userInfo).length / AVERAGE_CHARS_PER_TOKEN;
  size += JSON.stringify(memory.budget).length / AVERAGE_CHARS_PER_TOKEN;
  size += JSON.stringify(memory.transactions).length / AVERAGE_CHARS_PER_TOKEN;
  size += JSON.stringify(memory.goals).length / AVERAGE_CHARS_PER_TOKEN;
  size += JSON.stringify(memory.insights).length / AVERAGE_CHARS_PER_TOKEN;

  return size;
}

pruneContext(memory: ConversationMemory): ConversationMemory {
  // Summarize messages
  memory.messages = this.summarizeMessages(memory.messages);

  // Prune old transactions
  memory.transactions = this.pruneOldTransactions(memory.transactions);

  // Summarize insights
  memory.insights = this.summarizeInsights(memory.insights);

  return memory;
}
```

## Future Enhancements

As part of our roadmap, we plan to enhance our memory management approach with:

### GraphRAG Implementation

We plan to implement a knowledge graph for more contextual information retrieval:

```typescript
async getRelevantMemory(userId: string, query: string): Promise<RelevantMemory> {
  // Extract entities from the query
  const entities = await this.entityExtractor.extract(query);

  // Query the knowledge graph for relevant information
  const graphResults = await this.knowledgeGraph.query(entities);

  // Combine with vector search results
  const vectorResults = await this.vectorStore.similaritySearch(query);

  // Merge and rank results
  const mergedResults = this.mergeAndRankResults(graphResults, vectorResults);

  return mergedResults;
}
```

### Enhanced Pattern Recognition

We plan to implement more sophisticated pattern recognition to identify recurring financial behaviors:

```typescript
async identifyPatterns(userId: string): Promise<FinancialPatterns> {
  // Get the user's transaction history
  const transactions = await this.getTransactionHistory(userId);

  // Identify spending patterns
  const spendingPatterns = this.patternRecognizer.identifySpendingPatterns(transactions);

  // Identify income patterns
  const incomePatterns = this.patternRecognizer.identifyIncomePatterns(transactions);

  // Identify saving patterns
  const savingPatterns = this.patternRecognizer.identifySavingPatterns(transactions);

  return {
    spendingPatterns,
    incomePatterns,
    savingPatterns,
  };
}
```

### Personalized Financial Models

We plan to create personalized financial models for each user:

```typescript
async createPersonalizedModel(userId: string): Promise<PersonalizedModel> {
  // Get the user's financial data
  const financialData = await this.getUserFinancialData(userId);

  // Create a personalized model
  const model = await this.modelBuilder.build(financialData);

  // Save the model
  await this.savePersonalizedModel(userId, model);

  return model;
}
```

## Best Practices

When working with memory in our multi-agent system, follow these best practices:

1. **Privacy and Security**: Always ensure that user data is handled securely and in compliance with privacy regulations.
2. **Efficiency**: Optimize memory usage to minimize storage and retrieval costs.
3. **Relevance**: Focus on retrieving and using the most relevant memory for the current conversation.
4. **Context Management**: Be mindful of the context window limitations of the language model.
5. **Error Handling**: Implement robust error handling to ensure that memory operations don't fail silently.

## Conclusion

Memory management is a critical component of our multi-agent system, enabling the system to maintain context across multiple interactions with the user. By implementing sophisticated memory management strategies, we can provide personalized and contextually relevant responses that help users achieve their financial goals.

As we continue to enhance the Tamy Finance Assistant, our memory management approach will evolve to support more advanced features and provide an even more personalized experience for our users.
