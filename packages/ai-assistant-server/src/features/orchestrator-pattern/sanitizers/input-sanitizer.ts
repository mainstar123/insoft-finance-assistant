import { Injectable, Logger } from '@nestjs/common';
import { OrchestratorState, ORCHESTRATOR, ERROR_HANDLER } from '../types';
import { HumanMessage } from '@langchain/core/messages';
import { LanguageService } from '../services/language.service';
import { ProcessType } from '../types';

@Injectable()
export class InputSanitizerService {
  private readonly logger = new Logger(InputSanitizerService.name);

  constructor(private readonly languageService: LanguageService) {}

  async sanitizeInput(state: OrchestratorState): Promise<OrchestratorState> {
    try {
      this.logger.debug('Sanitizing input', {
        userId: state.userId,
        threadId: state.threadId,
      });

      // Always ensure memory context has required fields
      if (!state.memoryContext) {
        state.memoryContext = {
          relevantHistory: '',
          currentProcess: ProcessType.GENERAL_ASSISTANT,
          currentStep: 'general_assistant',
          lastInteraction: new Date(),
        };
      } else {
        // Ensure required fields are set if memoryContext exists but is incomplete
        if (!state.memoryContext.currentProcess) {
          state.memoryContext.currentProcess = ProcessType.GENERAL_ASSISTANT;
        }
        if (!state.memoryContext.currentStep) {
          state.memoryContext.currentStep = 'general_assistant';
        }
        if (!state.memoryContext.lastInteraction) {
          state.memoryContext.lastInteraction = new Date();
        }
        if (!state.memoryContext.relevantHistory) {
          state.memoryContext.relevantHistory = '';
        }
      }

      // Skip if no messages or already validated
      if (state.messages.length === 0 || state.metadata.inputValidated) {
        return {
          ...state,
          metadata: {
            ...state.metadata,
            inputValidated: true,
            lastNode: 'input_sanitizer',
          },
          next: ORCHESTRATOR,
        };
      }

      // Get the last message (should be from human)
      const lastMessage = state.messages[state.messages.length - 1];
      if (!(lastMessage instanceof HumanMessage)) {
        this.logger.warn('Last message is not from human', {
          messageType: lastMessage?.constructor?.name,
        });
        return {
          ...state,
          metadata: {
            ...state.metadata,
            inputValidated: true,
            lastNode: 'input_sanitizer',
          },
          next: ORCHESTRATOR,
        };
      }

      // Detect language for each new message to ensure accurate language switching
      if (
        lastMessage instanceof HumanMessage &&
        typeof lastMessage.content === 'string'
      ) {
        const languageInfo = await this.languageService.detectLanguage(
          lastMessage.content,
        );

        // Add language preference to memory context (we know it exists now)
        state.memoryContext.preferredLanguage = {
          code: languageInfo.languageCode,
          name: languageInfo.languageName,
          lastDetected: new Date(),
        };

        this.logger.debug(
          `Detected language: ${languageInfo.languageName} (${languageInfo.languageCode})`,
          {
            confidence: languageInfo.confidence,
            threadId: state.threadId,
          },
        );
      }

      // Extract message content
      const content =
        typeof lastMessage.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage.content);

      // Basic validation and sanitization
      const sanitizedContent = this.validateAndSanitize(content);

      // Check if content needed sanitization
      if (sanitizedContent !== content) {
        this.logger.debug('Content sanitized', {
          original: content,
          sanitized: sanitizedContent,
        });

        // Replace the message with sanitized content
        state.messages[state.messages.length - 1] = new HumanMessage({
          content: sanitizedContent,
        });
      }

      // Deduplicate messages to prevent context size issues
      state.messages = this.deduplicateMessages(state.messages);

      return {
        ...state,
        metadata: {
          ...state.metadata,
          inputValidated: true,
          lastNode: 'input_sanitizer',
        },
        next: ORCHESTRATOR,
      };
    } catch (error) {
      this.logger.error('Error sanitizing input', error);
      return {
        ...state,
        metadata: {
          ...state.metadata,
          lastError: `Input sanitization error: ${error instanceof Error ? error.message : String(error)}`,
          lastNode: 'input_sanitizer',
        },
        next: ERROR_HANDLER,
      };
    }
  }

  private validateAndSanitize(content: string): string {
    // Remove any script tags
    let sanitized = content.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      '',
    );

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Limit length if needed
    const MAX_LENGTH = 1000;
    if (sanitized.length > MAX_LENGTH) {
      sanitized = sanitized.substring(0, MAX_LENGTH) + '...';
    }

    return sanitized;
  }

  /**
   * Removes duplicate messages from the conversation history
   * This prevents the same message from appearing multiple times and causing context overflow
   */
  private deduplicateMessages(messages: any[]): any[] {
    if (!messages || messages.length <= 1) return messages;

    this.logger.debug(`Deduplicating messages (before: ${messages.length})`);

    // Use a Map to track seen message contents and their indices
    const messageMap = new Map<string, number>();
    const uniqueMessages = [];

    // Process messages in reverse order to keep the most recent ones
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];

      // Extract content based on message type
      let content = '';
      let type = '';

      if (message._getType) {
        // LangChain message
        type = message._getType();
        content =
          typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content);
      } else if (message.role) {
        // OpenAI message format
        type = message.role;
        content =
          typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.content);
      } else if (message.type) {
        // Custom message format
        type = message.type;
        content =
          typeof message.content === 'string'
            ? message.content
            : message.text || JSON.stringify(message.content);
      }

      // Create a key combining type and content
      const key = `${type}:${content}`;

      // Only add if we haven't seen this exact message before
      if (!messageMap.has(key)) {
        messageMap.set(key, i);
        uniqueMessages.unshift(message); // Add to front since we're going backwards
      }
    }

    this.logger.debug(
      `Deduplication complete (after: ${uniqueMessages.length})`,
    );

    return uniqueMessages;
  }
}
