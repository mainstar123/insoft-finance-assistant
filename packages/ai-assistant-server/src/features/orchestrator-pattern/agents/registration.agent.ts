import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { Injectable, Logger } from '@nestjs/common';
import {
  ERROR_HANDLER,
  hasPreferredLanguage,
  MemoryContext,
  OrchestratorState,
  OUTPUT_SANITIZER,
  ProcessType,
  REGISTRATION_WORKER,
} from '../types';
import { RegistrationTools } from '../tools/registration.tool';

@Injectable()
export class RegistrationWorker {
  private readonly logger = new Logger(RegistrationWorker.name);

  constructor(private readonly registrationTools: RegistrationTools) {}

  /**
   * Process registration by sending a WhatsApp form to the user
   */
  async processRegistration(
    state: OrchestratorState,
    config?: RunnableConfig,
  ): Promise<OrchestratorState> {
    try {
      this.logger.debug('Processing registration request', {
        userId: state.userId,
        threadId: state.threadId,
      });

      // Get the user's phone number from state
      const userPhone = state.metadata.userPhone || state.userId;

      if (!userPhone) {
        throw new Error('User phone number not found in state');
      }

      // Get the send registration form tool
      const sendRegistrationTool = this.registrationTools
        .getAllTools()
        .find((tool) => tool.name === 'send_registration_form');

      if (!sendRegistrationTool) {
        throw new Error('Send registration form tool not found');
      }

      const language = hasPreferredLanguage(state.memoryContext)
        ? state.memoryContext.preferredLanguage.code
        : 'pt';

      /// Send the registration form
      const result = await sendRegistrationTool.invoke({
        phoneNumber: userPhone,
        language,
      });

      const parsedResult = JSON.parse(result);

      // Create response message based on the result
      const responseMessage = new AIMessage({
        content: parsedResult.success
          ? parsedResult.message
          : 'Sorry, we encountered an error while trying to send you the registration form. Please try again later.',
      });

      // Create the updated memory context
      const updatedMemoryContext: MemoryContext = {
        relevantHistory: state.memoryContext?.relevantHistory || '',
        summary: state.memoryContext?.summary,
        currentProcess: ProcessType.GENERAL_ASSISTANT,
        currentStep: '',
        lastInteraction: new Date(),
        interruptedProcess: undefined,
        lastDiversion: state.memoryContext?.lastDiversion,
      };

      // Return updated state
      return {
        ...state,
        messages: [...state.messages, responseMessage],
        next: OUTPUT_SANITIZER,
        metadata: {
          ...state.metadata,
          lastNode: REGISTRATION_WORKER,
        },
        memoryContext: updatedMemoryContext,
      };
    } catch (error) {
      this.logger.error('Error in registration process', error);
      return {
        ...state,
        next: ERROR_HANDLER,
        metadata: {
          ...state.metadata,
          lastError: `Registration error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          lastNode: REGISTRATION_WORKER,
        },
      };
    }
  }
}
