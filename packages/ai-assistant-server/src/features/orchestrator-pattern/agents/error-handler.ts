import { Injectable, Logger } from '@nestjs/common';
import { OrchestratorState, ORCHESTRATOR, ERROR_HANDLER } from '../types';
import { AIMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  async handleError(state: OrchestratorState): Promise<OrchestratorState> {
    try {
      this.logger.debug('Handling error', {
        userId: state.userId,
        threadId: state.threadId,
        error: state.metadata.lastError,
        fromNode: state.metadata.lastNode,
      });

      // Create appropriate error message with language awareness
      let errorMessage =
        'I apologize, but there was an unexpected issue. Let me try to help you differently.';

      // If we know the user's language preference, use it to choose error messages
      if (state.memoryContext?.preferredLanguage) {
        const languageCode = state.memoryContext.preferredLanguage.code;

        // Let the LLM generate an appropriate error message in the user's language
        const prompt = `Generate a polite, brief error message in language code: ${languageCode}. The error type is: ${state.metadata.lastError || 'unknown error'}.`;

        try {
          const errorResponseModel = new ChatOpenAI({
            modelName: 'gpt-4o-mini',
            temperature: 0.2,
            cache: true,
          });

          const response = await errorResponseModel.invoke(prompt);
          errorMessage =
            typeof response.content === 'string'
              ? response.content
              : errorMessage;
        } catch (error) {
          // Fall back to default message
          this.logger.warn('Error generating localized error message', error);
        }
      }

      // Add error message to the conversation
      const updatedState = {
        ...state,
        messages: [
          ...state.messages,
          new AIMessage({
            content: errorMessage,
            name: 'ErrorHandler',
          }),
        ],
        metadata: {
          ...state.metadata,
          lastNode: ERROR_HANDLER,
          lastError: undefined, // Clear the error after handling
        },
        next: ORCHESTRATOR, // Return to orchestrator for next steps
      };

      return updatedState;
    } catch (error) {
      // If there's an error in the error handler, log it but don't create an infinite loop
      this.logger.error('Error in error handler', error);

      // Create a safe fallback state
      return {
        ...state,
        messages: [
          ...state.messages,
          new AIMessage({
            content:
              'I apologize, but I encountered an unexpected issue. Please try again later.',
            name: 'ErrorHandler',
          }),
        ],
        metadata: {
          ...state.metadata,
          lastNode: ERROR_HANDLER,
        },
        next: ORCHESTRATOR,
      };
    }
  }
}
