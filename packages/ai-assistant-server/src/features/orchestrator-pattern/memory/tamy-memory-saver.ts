import { SystemMessage } from '@langchain/core/messages';
import { MemorySaver } from '@langchain/langgraph';
import { Injectable, Logger } from '@nestjs/common';
import { MemoryManagerService } from './memory-manager.service';

interface MessageLike {
  _getType?: () => string;
  role?: string;
  content?: string;
  text?: string;
}

/**
 * TamyMemoryService provides centralized memory management for maintaining
 * context across all agents and workflows in the Tamy assistant.
 * It handles both LangGraph's built-in memory and our semantic memory store.
 */
@Injectable()
export class TamyMemoryService {
  private readonly logger = new Logger(TamyMemoryService.name);
  private readonly memorySaver = new MemorySaver();

  constructor(private readonly memoryManager: MemoryManagerService) {}

  /**
   * Get the memory saver instance to use with LangGraph
   */
  getMemorySaver(): MemorySaver {
    return this.memorySaver;
  }

  /**
   * Process state after retrieval from memory to add semantic memory context
   */
  async processStateWithMemory(state: any, message: string): Promise<any> {
    if (!state || !state.userId) {
      return state;
    }

    try {
      // Get relevant context from memory
      const relevantContext = await this.memoryManager.getContextForPrompt(
        state.userId,
        message,
        state.isRegistered || false,
      );

      // If state has messages array, deduplicate them first to prevent duplicates
      if (state.messages && Array.isArray(state.messages)) {
        // Deduplicate existing messages right away
        state.messages = this.deduplicateMessages(state.messages);
        this.logger.debug(
          `Deduplicated messages from memory, count: ${state.messages.length}`,
        );
      }

      // If we have relevant context, add it as a system message
      if (relevantContext) {
        // If state has messages array, add a system message with memory context
        if (state.messages && Array.isArray(state.messages)) {
          // Find existing system messages
          const systemMessages = state.messages.filter(
            (m: MessageLike) =>
              (m._getType && m._getType() === 'system') || m.role === 'system',
          );

          // Only add if we don't already have a memory context message
          if (
            !systemMessages.some((m: MessageLike) =>
              (m.content || m.text || '').includes(
                'Relevant context from past interactions',
              ),
            )
          ) {
            // Add system message with memory at the beginning
            const memoryMessage = new SystemMessage(relevantContext);
            state.messages = [
              memoryMessage,
              ...this.pruneMessages(state.messages),
            ];
          }
        }

        // Add to memoryContext if that field exists
        if (state.memoryContext) {
          state.memoryContext.relevantHistory = relevantContext;
          state.memoryContext.lastInteraction = new Date();
        } else {
          state.memoryContext = {
            relevantHistory: relevantContext,
            lastInteraction: new Date(),
            currentStep: state.currentStep || 'unknown',
          };
        }
      } else if (state.messages) {
        // Still prune messages if needed, even without relevant context
        state.messages = this.pruneMessages(state.messages);
      }

      return state;
    } catch (error) {
      this.logger.error('Error processing state with memory', error);
      return state; // Return original state on error
    }
  }

  /**
   * Save the last AI message to semantic memory after state processing
   */
  async saveAIMessageToMemory(state: any): Promise<void> {
    if (!state || !state.userId || !state.messages?.length) {
      return;
    }

    try {
      // Get the last message
      const lastMessage = state.messages[
        state.messages.length - 1
      ] as MessageLike;

      // Handle different message types (BaseMessage or plain objects)
      const isAiMessage =
        (lastMessage._getType && lastMessage._getType() === 'ai') ||
        lastMessage.role === 'assistant';

      if (isAiMessage) {
        const content = lastMessage.content || lastMessage.text;

        await this.memoryManager.storeConversationMemory(
          state.userId,
          content as string,
          state.isRegistered || false,
          {
            threadId: state.threadId,
            source: state.metadata?.lastNode || 'unknown',
          },
        );

        this.logger.debug(`Stored memory for thread ${state.threadId}`, {
          userId: state.userId,
          isRegistered: state.isRegistered,
        });
      }
    } catch (error) {
      this.logger.error('Error saving AI message to memory', error);
    }
  }

  /**
   * Helper method to prune messages to prevent context overflow
   */
  pruneMessages(messages: any[], maxLength: number = 15): any[] {
    if (!messages || messages.length <= maxLength) return messages;

    // Keep system messages (for context) and most recent messages
    const systemMessages = messages.filter(
      (m: MessageLike) =>
        (m._getType && m._getType() === 'system') || m.role === 'system',
    );

    const nonSystemMessages = messages.filter(
      (m: MessageLike) =>
        (!m._getType || m._getType() !== 'system') &&
        (!m.role || m.role !== 'system'),
    );

    // Deduplicate messages before slicing
    const dedupedMessages = this.deduplicateMessages(nonSystemMessages);

    // Keep recent messages up to the limit minus system messages
    const recentMessages = dedupedMessages.slice(
      -(maxLength - systemMessages.length),
    );

    return [...systemMessages, ...recentMessages];
  }

  /**
   * Deduplicate messages by content and type
   * Prevents duplicate messages while maintaining conversation flow
   */
  deduplicateMessages(messages: any[]): any[] {
    if (!messages || messages.length <= 1) return messages;

    // Use a Map to track seen message contents
    const messageMap = new Map<string, boolean>();
    const idMap = new Map<string, boolean>();
    const uniqueMessages = [];

    // Process messages in reverse order to keep the newest versions when duplicates exist
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (!message) continue; // Skip null/undefined messages

      // Track by ID if available
      if (message.id) {
        if (idMap.has(message.id)) continue; // Skip if we've seen this ID
        idMap.set(message.id, true);
      }

      // Extract content based on message type
      let content = '';
      let type = '';

      if (message._getType && typeof message._getType === 'function') {
        // LangChain message
        type = message._getType();
        content =
          typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content || '');
      } else if (message.role) {
        // OpenAI message format
        type = message.role;
        content =
          typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content || '');
      } else if (message.type) {
        // Custom message format
        type = message.type;
        content =
          typeof message.content === 'string'
            ? message.content
            : message.text || JSON.stringify(message.content || '');
      }

      // Skip empty or invalid messages
      if (!type || !content) continue;

      // Create a key combining type and content
      const key = `${type}:${content}`;

      // Only add if we haven't seen this exact message before
      if (!messageMap.has(key)) {
        messageMap.set(key, true);
        uniqueMessages.unshift(message); // Add to front since we're processing in reverse
      }
    }

    // Apply final limit to ensure we don't exceed reasonable size
    const MAX_MESSAGES = 10; // Strict limit
    if (uniqueMessages.length > MAX_MESSAGES) {
      // Keep any system messages plus most recent messages up to the limit
      const systemMessages = uniqueMessages.filter(
        (m) =>
          (m._getType &&
            typeof m._getType === 'function' &&
            m._getType() === 'system') ||
          m.role === 'system',
      );

      const nonSystemMessages = uniqueMessages.filter(
        (m) =>
          !(
            m._getType &&
            typeof m._getType === 'function' &&
            m._getType() === 'system'
          ) && !(m.role === 'system'),
      );

      return [
        ...systemMessages,
        ...nonSystemMessages.slice(-(MAX_MESSAGES - systemMessages.length)),
      ];
    }

    return uniqueMessages;
  }
}
