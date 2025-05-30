import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  GENERAL_ASSISTANT_WORKER,
  InterruptedProcess,
  MemoryContext,
  OrchestratorState,
  OUTPUT_SANITIZER,
  ProcessType,
  REGISTRATION_WORKER,
  ERROR_HANDLER,
} from '../types';

@Injectable()
export class GeneralAssistantWorker {
  private readonly logger = new Logger(GeneralAssistantWorker.name);
  private reactAgent;

  constructor() {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.5,
      cache: true,
    });

    // Define a tool to provide general information about Tamy
    const getTamyInfo = tool(
      (input) => {
        if (input.topic === 'capabilities') {
          return 'Tamy é um assistente financeiro que pode ajudar com educação financeira, orçamentos, e planejamento financeiro.';
        } else if (input.topic === 'introduction') {
          return 'Olá! Sou Tamy, seu assistente financeiro pessoal. Como posso ajudar?';
        }
        return 'Tamy é um assistente financeiro projetado para ajudar com suas necessidades financeiras.';
      },
      {
        name: 'get_tamy_info',
        description: 'Get information about Tamy Financial Assistant',
        schema: z.object({
          topic: z
            .string()
            .describe(
              'The topic about Tamy to get information on (capabilities, introduction, etc)',
            ),
        }),
      },
    );

    // Create the ReAct agent with a language-neutral prompt
    const customPrompt =
      'You are Tamy, a friendly and helpful financial assistant. Be polite and professional, but also friendly. Always respond in the same language as the user.';

    this.reactAgent = createReactAgent({
      llm: model,
      tools: [getTamyInfo],
      stateModifier: customPrompt,
    });
  }

  /**
   * Check if we need to create an interruption record
   */
  private isInterruptingAnotherProcess(state: OrchestratorState): boolean {
    // If there's already an interrupted process, we're not creating a new one
    if (state.memoryContext?.interruptedProcess) {
      return false;
    }

    // Check if we're interrupting a registration process
    if (
      state.memoryContext?.currentProcess === ProcessType.REGISTRATION &&
      state.memoryContext?.registrationState?.step !== 'completed'
    ) {
      return true;
    }

    // Not interrupting anything
    return false;
  }

  /**
   * Create an interrupted process record
   */
  private createInterruptedProcess(
    state: OrchestratorState,
  ): InterruptedProcess | undefined {
    if (!this.isInterruptingAnotherProcess(state)) {
      return undefined;
    }

    // If interrupting registration
    if (state.memoryContext?.currentProcess === ProcessType.REGISTRATION) {
      return {
        type: ProcessType.REGISTRATION,
        returnToAgent: REGISTRATION_WORKER,
        originalStep: state.memoryContext.currentStep || '',
        timestamp: new Date(),
        data: state.memoryContext.registrationState,
      };
    }

    // Add other process types as needed

    return undefined;
  }

  async handleGeneralInquiry(
    state: OrchestratorState,
    config?: RunnableConfig,
  ): Promise<OrchestratorState> {
    console.log('🚀 ~ GeneralAssistantWorker ~ config:', config);
    console.log('🚀 ~ GeneralAssistantWorker ~ state:', state);
    try {
      this.logger.debug('Processing general inquiry', {
        userId: state.userId,
        threadId: state.threadId,
        isInterruption: this.isInterruptingAnotherProcess(state),
      });

      // Check if we're interrupting another process and create a record if needed
      const interruptedProcess = this.createInterruptedProcess(state);
      const isTemporaryDiversion = !!interruptedProcess;

      // Map state messages to format expected by ReAct agent
      const messages = state.messages.map((msg) => ({
        role: msg._getType() === 'human' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Add language context as a system message if available
      if (state.memoryContext?.preferredLanguage) {
        messages.unshift({
          role: 'system',
          content: `The user is communicating in ${state.memoryContext.preferredLanguage.name} (${state.memoryContext.preferredLanguage.code}). Please respond in the same language.`,
        });
      }

      // Use the ReAct agent to generate a response
      const result = await this.reactAgent.invoke(
        { messages },
        {
          ...config,
        },
      );

      // Extract the latest assistant message
      const aiMessage = new AIMessage({
        content: result.messages[result.messages.length - 1]?.content!,
      });

      // Prepare the updated memory context
      const updatedMemoryContext: MemoryContext = {
        // Required properties
        relevantHistory: state.memoryContext?.relevantHistory || '',
        lastInteraction: new Date(),
        currentStep: isTemporaryDiversion
          ? state.memoryContext?.currentStep || ''
          : 'general_assistant',

        // Optional properties
        summary: state.memoryContext?.summary,
        registrationState: state.memoryContext?.registrationState,

        // Store the interrupted process info if we're interrupting something
        interruptedProcess,

        // Set current process only if we're not just temporarily diverting
        currentProcess: isTemporaryDiversion
          ? state.memoryContext?.currentProcess
          : ProcessType.GENERAL_ASSISTANT,

        // Track the diversion
        lastDiversion: isTemporaryDiversion
          ? {
              from: state.memoryContext?.currentProcess || '',
              to: ProcessType.GENERAL_ASSISTANT,
              timestamp: new Date(),
            }
          : state.memoryContext?.lastDiversion,
      };

      // Return updated state with the new message
      return {
        ...state,
        messages: [...state.messages, aiMessage],
        next: OUTPUT_SANITIZER,
        metadata: {
          ...state.metadata,
          lastNode: GENERAL_ASSISTANT_WORKER,
          temporaryDiversion: isTemporaryDiversion,
        },
        memoryContext: updatedMemoryContext,
      };
    } catch (error) {
      this.logger.error('Error in general assistant worker', error);

      // Create a default message when we hit an error
      const defaultResponse =
        'Olá! Tudo bem com você? Como posso ajudar com suas questões financeiras hoje?';
      const aiMessage = new AIMessage({
        content: defaultResponse,
      });

      // Create proper memory context with required properties
      const errorMemoryContext: MemoryContext = {
        // Required properties
        relevantHistory: state.memoryContext?.relevantHistory || '',
        currentStep: state.memoryContext?.currentStep || 'general_assistant',
        lastInteraction: new Date(),

        // Preserve existing properties
        summary: state.memoryContext?.summary,
        registrationState: state.memoryContext?.registrationState,
        currentProcess: state.memoryContext?.currentProcess,
        interruptedProcess: state.memoryContext?.interruptedProcess,
        lastDiversion: state.memoryContext?.lastDiversion,
      };

      return {
        ...state,
        messages: [...state.messages, aiMessage],
        metadata: {
          ...state.metadata,
          lastError: `General assistant error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          lastNode: GENERAL_ASSISTANT_WORKER,
        },
        next: ERROR_HANDLER,
        memoryContext: errorMemoryContext,
      };
    }
  }

  private async updateMemoryContext(state: OrchestratorState): Promise<void> {
    // Update memory context with current process and step
    state.memoryContext = {
      // Required properties
      relevantHistory: state.memoryContext?.relevantHistory || '',
      currentProcess: ProcessType.GENERAL_ASSISTANT,
      currentStep: state.memoryContext?.currentStep || 'general_assistant',
      lastInteraction: new Date(),
      // Optional properties
      preferredLanguage: state.memoryContext?.preferredLanguage,
      summary: state.memoryContext?.summary,
      registrationState: state.memoryContext?.registrationState,
      interruptedProcess: state.memoryContext?.interruptedProcess,
      lastDiversion: state.memoryContext?.lastDiversion,
    };
  }
}
