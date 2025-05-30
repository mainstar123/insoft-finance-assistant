import { RunnableConfig } from '@langchain/core/runnables';
import { END } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  ERROR_HANDLER,
  FINANCIAL_COACH_WORKER,
  GENERAL_ASSISTANT_WORKER,
  OrchestratorState,
  ProcessType,
  REGISTRATION_WORKER,
  RegistrationSteps,
} from '../types';
import { Command, interrupt } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

// Define the routing schema using Zod
const RoutingSchema = z.object({
  routeTo: z.enum([
    REGISTRATION_WORKER,
    FINANCIAL_COACH_WORKER,
    GENERAL_ASSISTANT_WORKER,
    ERROR_HANDLER,
    END,
  ]),
  reasoning: z
    .string()
    .describe('Detailed explanation for the routing decision'),
  shouldMaintainProcess: z
    .boolean()
    .describe('Whether to maintain the current process')
    .default(true),
});

// Define the TypeScript type that matches the schema
type RoutingDecision = {
  routeTo: string;
  reasoning: string;
  shouldMaintainProcess: boolean;
};

@Injectable()
export class OrchestratorAgent {
  private readonly logger = new Logger(OrchestratorAgent.name);
  private reactAgentModel: ChatOpenAI;

  constructor() {
    // Initialize the model for the React agent with consistent settings
    this.reactAgentModel = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
    });
  }

  async createOrchestratorAgent(llm: ChatOpenAI, state: OrchestratorState) {
    // Extract contextual information from state
    const currentProcess = state.memoryContext?.currentProcess || '';
    const currentStep = state.memoryContext?.currentStep || '';
    const lastInteraction = state.memoryContext?.lastInteraction || '';
    const registrationState = state.memoryContext?.registrationState
      ? JSON.stringify(state.memoryContext.registrationState)
      : '';
    const isRegistered = state.isRegistered;

    // Extract the recent message history for better context
    const recentMessages =
      state.messages.length > 0
        ? state.messages
            .slice(-3)
            .map((m) => {
              const isAiMessage =
                m.constructor.name === 'AIMessage' ||
                ('_getType' in m && m._getType() === 'ai');
              return `${isAiMessage ? 'Assistant' : 'User'}: ${m.content}`;
            })
            .join('\\n')
        : '';

    const memoryContext = `
Current process: ${currentProcess}
Current step: ${currentStep}
Last interaction: ${lastInteraction}
Registration state: ${registrationState}
Is user registered: ${isRegistered ? 'Yes' : 'No'}
Recent messages:
${recentMessages}
Recent conversation history: ${state.memoryContext?.relevantHistory || ''}
`;

    // Add language context
    const languageContext = state.memoryContext?.preferredLanguage
      ? `User is communicating in ${state.memoryContext.preferredLanguage.name} (${state.memoryContext.preferredLanguage.code}).`
      : '';

    const basePrompt = `You are an orchestrator agent responsible for coordinating user interactions in the Tamy Finance Assistant. Your role is to analyze user messages and route them to the appropriate specialized worker while maintaining conversation coherence and process continuity.

${languageContext}

3. PROCESS PRIORITY HIERARCHY:
   1. HIGH: Explicit registration requests
   2. MEDIUM: Financial questions (to financial_coach_worker)
   3. LOW: General queries (to general_assistant_worker)

4. CONTEXT AWARENESS:
   - Consider message length (short responses likely continue current process)
   - Check for explicit exit/change topic indicators
   - Validate if input matches expected format for current step

ROUTING RULES:
1. registration_worker:
   - When user explicitly asks to register/signup/create account
   - NEVER force registration on users
2. financial_coach_worker:
   - For financial education/advice
   - Personal finance questions
   - Financial concept explanations
3. general_assistant_worker:
   - General chat/questions
   - Default for unclear intent
   - When user explicitly exits other processes

Current process: ${currentProcess}
Current step: ${currentStep}
User is registered: ${isRegistered ? 'Yes' : 'No'}
`;

    // Add memory context if available
    const fullPrompt = `${basePrompt}\\n\\nRelevant context from previous interactions:\\n${memoryContext}`;

    // Create ReAct agent with structured output
    return createReactAgent({
      llm,
      tools: [],
      prompt: fullPrompt,
      responseFormat: {
        schema: RoutingSchema,
        prompt:
          "Analyze the conversation and decide which agent should handle it next. CRITICAL: If there's an active process (especially REGISTRATION), you MUST continue routing to the same worker unless the user explicitly requests to stop. For registration, treat any name/email responses as part of the registration flow. Set shouldMaintainProcess=false ONLY if user explicitly requests to exit the current process.",
      },
    });
  }

  /**
   * Helper method to get the appropriate worker for a process type
   */
  private getWorkerForProcessType(
    processType: ProcessType | undefined,
  ): string {
    if (!processType) {
      return GENERAL_ASSISTANT_WORKER;
    }

    switch (processType) {
      case ProcessType.REGISTRATION:
        return REGISTRATION_WORKER;
      case ProcessType.FINANCIAL_EDUCATION:
        return FINANCIAL_COACH_WORKER;
      case ProcessType.GENERAL_ASSISTANT:
        return GENERAL_ASSISTANT_WORKER;
      default:
        return GENERAL_ASSISTANT_WORKER;
    }
  }

  /**
   * Helper method to check if a process type is registration
   */
  private isRegistrationProcess(processType: ProcessType | undefined): boolean {
    return processType === ProcessType.REGISTRATION;
  }

  async orchestrate(
    state: OrchestratorState,
  ): Promise<RoutingDecision | Command | OrchestratorState> {
    try {
      this.logger.debug('Orchestrating message routing', {
        currentProcess: state.metadata?.currentProcess,
        registrationStep: state.metadata?.registrationStep,
      });

      // RULE 1: Check for active registration process
      if (this.isRegistrationProcess(state.memoryContext?.currentProcess)) {
        const result = await this.enforceProcessContinuity(state);

        // If this is a Command (like an interrupt), return it directly
        if ('type' in result) {
          return result;
        }

        // Force routing to registration worker for active registration
        state.next = REGISTRATION_WORKER;
        state.metadata.routingReason =
          'Maintaining active registration process';
        state.metadata.shouldMaintainProcess = true;
        return state;
      }

      // RULE 2: Check for interrupted process that needs resuming
      if (
        state.memoryContext?.interruptedProcess &&
        state.metadata?.temporaryDiversion
      ) {
        const interruptedProcess = state.memoryContext.interruptedProcess;
        state.next = this.getWorkerForProcessType(interruptedProcess.type);
        state.metadata.routingReason = `Resuming interrupted ${interruptedProcess.type} process`;
        state.metadata.shouldMaintainProcess = true;
        return state;
      }

      // RULE 3: Use ReactAgent for intelligent routing
      const routingDecision = await this.analyzeWithReactAgent(state);

      console.log("🚀 ~ OrchestratorAgent ~ routingDecision:", routingDecision)
      // RULE 4: Override routing if necessary to maintain process continuity
      if (this.isRegistrationProcess(state.memoryContext?.currentProcess)) {
        state.next = REGISTRATION_WORKER;
        state.metadata.routingReason =
          'Enforcing registration process continuity';
        state.metadata.shouldMaintainProcess = true;
        return state;
      }

      // Set the next destination and metadata
      state.next = routingDecision.routeTo;
      state.metadata.routingReason = routingDecision.reasoning;
      state.metadata.shouldMaintainProcess =
        routingDecision.shouldMaintainProcess;

      return state;
    } catch (error) {
      this.logger.error('Error in orchestration', error);
      state.next = ERROR_HANDLER;
      state.metadata.routingReason = 'Error occurred during orchestration';
      state.metadata.shouldMaintainProcess = false;
      return state;
    }
  }

  private async enforceProcessContinuity(
    state: OrchestratorState,
  ): Promise<RoutingDecision | Command> {
    try {
      // Check for explicit exit indicators
      if (await this.hasExplicitExitIndicator(state)) {
        return interrupt({
          resume: 'Would you like to exit the current process?',
          metadata: {
            interruptType: 'process_exit',
            currentProcess: state.memoryContext?.currentProcess,
          },
        });
      }

      // Special handling for registration process
      if (this.isRegistrationProcess(state.memoryContext?.currentProcess)) {
        // Check for name validation
        if (await this.needsNameValidation(state)) {
          return interrupt({
            resume: 'Please confirm your name:',
            metadata: {
              interruptType: 'name_validation',
            },
          });
        }

        // Check for email validation
        if (await this.needsEmailValidation(state)) {
          return interrupt({
            resume: 'Please confirm your email address:',
            metadata: {
              interruptType: 'email_validation',
            },
          });
        }

        // Continue registration process
        return {
          routeTo: REGISTRATION_WORKER,
          reasoning: 'Continuing active registration process',
          shouldMaintainProcess: true,
        };
      }

      // Default routing decision based on current process
      return {
        routeTo: this.getWorkerForProcessType(
          state.memoryContext?.currentProcess,
        ),
        reasoning: 'Continuing current process',
        shouldMaintainProcess: true,
      };
    } catch (error) {
      this.logger.error('Error in process continuity check', error);
      return {
        routeTo: ERROR_HANDLER,
        reasoning: 'Error occurred during process continuity check',
        shouldMaintainProcess: false,
      };
    }
  }

  private async hasExplicitExitIndicator(
    state: OrchestratorState,
  ): Promise<boolean> {
    const lastMessage = state.metadata?.lastMessage?.toLowerCase() || '';
    const exitIndicators = [
      'exit',
      'quit',
      'cancel',
      'stop',
      'leave',
      'não quero',
      'not interested',
      'change topic',
      'different',
      'something else',
    ];
    return exitIndicators.some((indicator) => lastMessage.includes(indicator));
  }

  private async needsNameValidation(
    state: OrchestratorState,
  ): Promise<boolean> {
    if (state.metadata?.currentProcess !== ProcessType.REGISTRATION) {
      return false;
    }
    if (state.metadata?.registrationStep !== RegistrationSteps.COLLECT_NAME) {
      return false;
    }
    const lastMessage = state.metadata?.lastMessage || '';
    // Check if it looks like a name but hasn't been confirmed
    const words = lastMessage.split(/\s+/);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(
      lastMessage,
    );
    const isQuestion = lastMessage.includes('?');
    const isReasonableLength =
      lastMessage.length >= 2 && lastMessage.length <= 100;
    const hasReasonableWordCount = words.length >= 1 && words.length <= 5;

    return (
      isReasonableLength &&
      hasReasonableWordCount &&
      !hasSpecialChars &&
      !isQuestion &&
      !lastMessage.toLowerCase().includes('confirm')
    );
  }

  private async needsEmailValidation(
    state: OrchestratorState,
  ): Promise<boolean> {
    if (state.metadata?.currentProcess !== ProcessType.REGISTRATION) {
      return false;
    }
    if (state.metadata?.registrationStep !== RegistrationSteps.COLLECT_EMAIL) {
      return false;
    }
    const lastMessage = state.metadata?.lastMessage || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      emailRegex.test(lastMessage) &&
      !lastMessage.toLowerCase().includes('confirm')
    );
  }

  private handleCommand(
    command: Command,
    state: OrchestratorState,
  ): RoutingDecision {
    try {
      // Check if this is a resume command
      if ('resume' in command && command.resume) {
        const resumeValue =
          typeof command.resume === 'string'
            ? command.resume
            : typeof command.resume === 'object' && 'value' in command.resume
              ? String(command.resume.value)
              : '';

        // Handle different interrupt types
        switch (state.metadata?.interruptType) {
          case 'process_exit':
            // If user confirms exit
            if (resumeValue.toLowerCase().includes('yes')) {
              return {
                routeTo: GENERAL_ASSISTANT_WORKER,
                reasoning: 'User confirmed exit from current process',
                shouldMaintainProcess: false,
              };
            }
            // Continue current process
            return {
              routeTo: this.getWorkerForProcessType(
                state.memoryContext?.currentProcess,
              ),
              reasoning: 'User wants to continue current process',
              shouldMaintainProcess: true,
            };

          case 'name_validation':
          case 'email_validation':
            // Continue with registration after validation
            return {
              routeTo: REGISTRATION_WORKER,
              reasoning: 'Continuing registration after validation',
              shouldMaintainProcess: true,
            };

          default:
            // Default to general assistant if interrupt type is unknown
            return {
              routeTo: GENERAL_ASSISTANT_WORKER,
              reasoning:
                'Unknown interrupt type, defaulting to general assistant',
              shouldMaintainProcess: false,
            };
        }
      }

      // For other command types, default to general assistant
      return {
        routeTo: GENERAL_ASSISTANT_WORKER,
        reasoning: 'Default routing for command handling',
        shouldMaintainProcess: false,
      };
    } catch (error) {
      this.logger.error('Error handling command', error);
      return {
        routeTo: ERROR_HANDLER,
        reasoning: 'Error occurred during command handling',
        shouldMaintainProcess: false,
      };
    }
  }

  private async analyzeWithReactAgent(
    state: OrchestratorState,
  ): Promise<RoutingDecision> {
    try {
      // Create the orchestrator agent
      const agent = await this.createOrchestratorAgent(
        this.reactAgentModel,
        state,
      );

      // Prepare messages for the agent
      const messages = state.messages.map((msg) => ({
        role:
          msg._getType?.() === 'human'
            ? 'user'
            : msg._getType?.() === 'ai'
              ? 'assistant'
              : 'system',
        content:
          typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content),
      }));

      // If no messages, use the last message from metadata
      if (messages.length === 0 && state.metadata?.lastMessage) {
        messages.push({
          role: 'user',
          content: state.metadata.lastMessage,
        });
      }

      // Invoke the agent
      const result = await agent.invoke({ messages });

      // Extract the structured response
      if (
        result &&
        typeof result === 'object' &&
        'structuredResponse' in result &&
        result.structuredResponse &&
        typeof result.structuredResponse === 'object'
      ) {
        const structured = result.structuredResponse as any;

        return {
          routeTo: structured.routeTo || GENERAL_ASSISTANT_WORKER,
          reasoning: structured.reasoning || 'Default routing by orchestrator',
          shouldMaintainProcess: structured.shouldMaintainProcess ?? true,
        };
      }

      // Fallback for unexpected response structure
      this.logger.warn('ReactAgent returned unexpected response structure', {
        result,
      });
      return {
        routeTo: GENERAL_ASSISTANT_WORKER,
        reasoning:
          'Unexpected agent response format, defaulting to general assistant',
        shouldMaintainProcess: false,
      };
    } catch (error) {
      this.logger.error('Error using ReactAgent for routing analysis', error);
      return {
        routeTo: GENERAL_ASSISTANT_WORKER,
        reasoning:
          'Error occurred during intelligent routing, defaulting to general assistant',
        shouldMaintainProcess: false,
      };
    }
  }
}
