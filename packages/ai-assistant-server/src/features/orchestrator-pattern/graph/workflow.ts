import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { END, START, StateGraph } from '@langchain/langgraph';
import { Injectable, Logger } from '@nestjs/common';
import {
  ErrorHandlerService,
  FinancialCoachWorker,
  GeneralAssistantWorker,
  OrchestratorAgent,
  RegistrationWorker,
} from '../agents';
import { TamyMemoryService } from '../memory';
import { InputSanitizerService } from '../sanitizers';
import {
  ERROR_HANDLER,
  FINANCIAL_COACH_WORKER,
  GENERAL_ASSISTANT_WORKER,
  INPUT_SANITIZER,
  ORCHESTRATOR,
  OrchestratorNodes,
  OrchestratorState,
  orchestratorStateChannels,
  OUTPUT_SANITIZER,
  ProcessType,
  REGISTRATION_WORKER,
} from '../types';
import { OutputSanitizerAgent } from '../agents/output-sanitizer.agent';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly tamyMemory: TamyMemoryService,
    private readonly orchestratorAgent: OrchestratorAgent,
    private readonly registrationWorker: RegistrationWorker,
    private readonly financialCoachWorker: FinancialCoachWorker,
    private readonly generalAssistantWorker: GeneralAssistantWorker,
    private readonly errorHandler: ErrorHandlerService,
    private readonly inputSanitizer: InputSanitizerService,
    private readonly outputSanitizer: OutputSanitizerAgent,
  ) {}

  async createWorkflow() {
    try {
      this.logger.debug('Creating orchestrator-worker-sanitizer workflow');

      // Initialize the StateGraph with proper typing
      const workflow = new StateGraph<
        OrchestratorState,
        OrchestratorState,
        Partial<OrchestratorState>,
        OrchestratorNodes
      >({
        channels: orchestratorStateChannels,
      });

      // Add nodes for the workflow
      this.logger.debug('Adding nodes to workflow');

      // Add the input sanitizer node
      workflow.addNode(INPUT_SANITIZER, async (state: OrchestratorState) => {
        return await this.inputSanitizer.sanitizeInput(state);
      });

      // Add the orchestrator node
      workflow.addNode(ORCHESTRATOR, async (state: OrchestratorState) => {
        return await this.orchestratorAgent.orchestrate(state);
      });

      // Add the registration worker node
      workflow.addNode(
        REGISTRATION_WORKER,
        async (state: OrchestratorState) => {
          return await this.registrationWorker.processRegistration(state);
        },
      );

      // Add the financial coach worker node
      workflow.addNode(
        FINANCIAL_COACH_WORKER,
        async (state: OrchestratorState) => {
          return await this.financialCoachWorker.provideFinancialEducation(
            state,
          );
        },
      );

      // Add the general assistant worker node
      workflow.addNode(
        GENERAL_ASSISTANT_WORKER,
        async (state: OrchestratorState) => {
          return await this.generalAssistantWorker.handleGeneralInquiry(state);
        },
      );

      // Add the output sanitizer node
      workflow.addNode(OUTPUT_SANITIZER, async (state: OrchestratorState) => {
        return await this.outputSanitizer.processOutput(state);
      });

      // Add the error handler node
      workflow.addNode(ERROR_HANDLER, async (state: OrchestratorState) => {
        return await this.errorHandler.handleError(state);
      });

      // Add edges for the workflow
      this.logger.debug('Adding edges to workflow');

      // Initial entry point goes to input sanitizer
      workflow.addEdge(START, INPUT_SANITIZER);

      // Input sanitizer goes to orchestrator
      workflow.addEdge(INPUT_SANITIZER, ORCHESTRATOR);

      // Orchestrator decides where to go next
      workflow.addConditionalEdges(
        ORCHESTRATOR,
        async (state: OrchestratorState) => state.next || END,
        [
          REGISTRATION_WORKER,
          FINANCIAL_COACH_WORKER,
          GENERAL_ASSISTANT_WORKER,
          ERROR_HANDLER,
          END,
        ],
      );

      // Worker nodes go to output sanitizer
      workflow.addEdge(REGISTRATION_WORKER, OUTPUT_SANITIZER);
      workflow.addEdge(FINANCIAL_COACH_WORKER, OUTPUT_SANITIZER);
      workflow.addEdge(GENERAL_ASSISTANT_WORKER, OUTPUT_SANITIZER);

      // Output sanitizer always ends the conversation
      workflow.addEdge(OUTPUT_SANITIZER, END);

      // Error handler goes back to orchestrator
      workflow.addEdge(ERROR_HANDLER, ORCHESTRATOR);

      // Compile and return the workflow
      this.logger.debug('Compiling workflow');
      return workflow.compile({
        name: 'tamy-finance-orchestrator-workflow',
        checkpointer: this.tamyMemory.getMemorySaver(),
      });
    } catch (error) {
      this.logger.error('Error creating workflow', error);
      throw error;
    }
  }

  /**
   * Gets the current state for a thread
   * @param threadId - ID of the thread to get state for
   * @returns Current state if exists, null otherwise
   */
  async getThreadState(threadId: string): Promise<OrchestratorState | null> {
    try {
      // Get the memorySaver instance
      const memorySaver = this.tamyMemory.getMemorySaver();

      // Attempt to get the state from memory
      const savedState = await memorySaver.get({
        configurable: { thread_id: threadId },
      });
      console.log(
        '🚀 ~ WorkflowService ~ getThreadState ~ savedState:',
        savedState,
      );

      if (!savedState) {
        return null;
      }

      // In LangGraph, the actual state is nested inside channel_values
      const channelValues = savedState.channel_values;

      // If channel_values doesn't exist, we can't proceed
      if (!channelValues || typeof channelValues !== 'object') {
        this.logger.warn(
          `Retrieved thread state missing channel_values for thread ${threadId}`,
        );
        return null;
      }

      // Extract the state from channel_values
      const state = channelValues as any as OrchestratorState;

      // Verify that it has basic structure of OrchestratorState
      if (!state.messages || !Array.isArray(state.messages)) {
        this.logger.warn(
          `Retrieved thread state has invalid message structure for thread ${threadId}`,
        );
        return null;
      }

      // Initialize missing fields with defaults if needed
      state.metadata = state.metadata || {
        threadId,
        channelType: 'WHATSAPP',
        userPhone: state.userId || '',
        inputValidated: false,
        outputValidated: false,
        isNewConversation: false,
      };

      state.memoryContext = state.memoryContext || {
        relevantHistory: '',
        lastInteraction: new Date(),
        currentStep: '',
      };

      // Enhanced registration state preservation
      if (state.memoryContext?.currentProcess === ProcessType.REGISTRATION) {
        this.logger.debug(
          `Preserving registration state for thread ${threadId}`,
          {
            currentStep: state.memoryContext?.currentStep,
            registrationState: JSON.stringify(
              state.memoryContext?.registrationState,
            ),
            currentProcess: state.memoryContext?.currentProcess,
          },
        );

        // Ensure next node is REGISTRATION_WORKER to maintain registration flow
        if (state.memoryContext?.registrationState?.step) {
          this.logger.debug(
            `Ensuring registration continuity with step: ${state.memoryContext.registrationState.step}`,
          );

          // Force next node to be registration worker to maintain context
          state.next = REGISTRATION_WORKER;

          // If we've already collected some information, ensure it's preserved
          if (
            !state.metadata.routingReason &&
            state.next === REGISTRATION_WORKER
          ) {
            state.metadata.routingReason = `Maintaining registration flow at step ${state.memoryContext.registrationState.step}.`;
          }
        }

        // If we're at a specific registration step but interruptedProcess is set,
        // it might be causing confusion - clear it
        if (
          state.memoryContext?.interruptedProcess?.type ===
            ProcessType.REGISTRATION &&
          state.memoryContext?.currentProcess === ProcessType.REGISTRATION
        ) {
          this.logger.debug(
            'Clearing interrupted process as we are already in registration',
            {
              threadId,
              currentStep: state.memoryContext?.currentStep,
            },
          );
          state.memoryContext.interruptedProcess = undefined;
        }
      }

      // Apply deduplication on retrieved state
      state.messages = this.tamyMemory.deduplicateMessages(state.messages);

      return state;
    } catch (error) {
      this.logger.error(
        `Error retrieving thread state: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  /**
   * Ensure we don't have too many messages by applying aggressive deduplication
   * @param state Current state to clean up
   * @returns Cleaned state with deduped messages
   */
  private ensureCleanState(state: OrchestratorState): OrchestratorState {
    if (!state || !state.messages || !Array.isArray(state.messages)) {
      return state;
    }

    // Apply our enhanced deduplication
    state.messages = this.tamyMemory.deduplicateMessages(state.messages);

    return state;
  }

  async processMessage(
    userId: string,
    threadId: string,
    message: string,
    isRegistered: boolean = false,
  ) {
    console.log('🚀 ~ WorkflowService ~ processMessage ~ message:', message);
    console.log(
      '🚀 ~ WorkflowService ~ processMessage ~ isRegistered:',
      isRegistered,
    );
    console.log('🚀 ~ WorkflowService ~ processMessage ~ userId:', userId);
    console.log('🚀 ~ WorkflowService ~ processMessage ~ threadId:', threadId);
    try {
      this.logger.debug('Processing message', {
        userId,
        threadId,
        messageLength: message.length,
        isRegistered,
      });

      // Create or retrieve workflow
      const workflow = await this.createWorkflow();

      // Retrieve existing thread state before processing
      const existingState = await this.getThreadState(threadId);

      // Check for active registration flow
      const isInRegistrationFlow =
        existingState &&
        existingState.memoryContext &&
        existingState.memoryContext.currentProcess ===
          ProcessType.REGISTRATION &&
        existingState.memoryContext.registrationState &&
        existingState.memoryContext.registrationState.step;

      if (
        isInRegistrationFlow &&
        existingState &&
        existingState.memoryContext
      ) {
        this.logger.debug('Detected active registration flow', {
          step: existingState.memoryContext.registrationState?.step,
          isRegistered,
        });
      }

      // Set up thread configuration
      const config = {
        configurable: {
          thread_id: threadId,
        },
      };

      // IMPORTANT: This is a utility function to strictly deduplicate messages
      const deduplicateAndPruneMessages = (messages: any[]): BaseMessage[] => {
        if (!messages || !Array.isArray(messages))
          return [new HumanMessage(message)];

        this.logger.debug(
          `Deduplicating initial state (before: ${messages.length} messages)`,
        );

        // First deduplicate messages based on content and type
        const seen = new Map();
        const uniqueMessages = [];

        // Process in reverse to prefer newer messages
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];

          // Skip null or undefined messages
          if (!msg) continue;

          // Extract key identifiers from message
          let content = '';
          let type = '';

          if (msg._getType && typeof msg._getType === 'function') {
            type = msg._getType();
            content =
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content || '');
          } else if (msg.role) {
            type = msg.role;
            content =
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content || '');
          } else if (msg.type) {
            type = msg.type;
            content =
              typeof msg.content === 'string'
                ? msg.content
                : msg.text || JSON.stringify(msg.content || '');
          }

          const key = `${type}:${content}`;

          if (!seen.has(key)) {
            seen.set(key, true);
            uniqueMessages.unshift(msg);
          }
        }

        // Now strictly enforce a maximum size
        const MAX_HISTORY = 6; // Reduced from 10 to prevent size issues

        // Split into system and non-system messages - carefully check for nulls
        const systemMessages = uniqueMessages.filter(
          (m) =>
            m &&
            ((m._getType &&
              typeof m._getType === 'function' &&
              m._getType() === 'system') ||
              (m.role && m.role === 'system')),
        );

        const nonSystemMessages = uniqueMessages.filter(
          (m) =>
            m &&
            ((m._getType &&
              typeof m._getType === 'function' &&
              m._getType() !== 'system') ||
              !m.role ||
              m.role !== 'system'),
        );

        // Ensure we have the current message at the end
        let currentMessageIncluded = false;
        for (const msg of nonSystemMessages) {
          if (
            msg &&
            msg.content &&
            ((typeof msg.content === 'string' && msg.content === message) ||
              (typeof msg.content === 'object' &&
                JSON.stringify(msg.content) === message))
          ) {
            currentMessageIncluded = true;
            break;
          }
        }

        // Add the new message if it wasn't found
        if (!currentMessageIncluded) {
          nonSystemMessages.push(new HumanMessage(message));
        }

        // Keep only last few non-system messages
        const recentMessages = nonSystemMessages.slice(-MAX_HISTORY);

        // Combine system messages with recent messages
        const prunedMessages = [...systemMessages, ...recentMessages];

        this.logger.debug(
          `State deduplication complete (after: ${prunedMessages.length} messages)`,
        );

        return prunedMessages;
      };

      // Create initial state with memory-enhanced context
      const initialState = {
        messages: [new HumanMessage(message)],
        userId,
        threadId,
        isRegistered,
        metadata: {
          threadId,
          channelType: 'WHATSAPP',
          userPhone: userId,
          inputValidated: false,
          outputValidated: false,
          isNewConversation: !existingState, // Only true if no existing state
        },
      };

      // Process the initial state with memory context
      const stateWithMemory = await this.tamyMemory.processStateWithMemory(
        initialState,
        message,
      );

      // Apply strict deduplication to start with a clean state
      stateWithMemory.messages = deduplicateAndPruneMessages(
        stateWithMemory.messages,
      );

      // If we have an active registration process, ensure we preserve it
      if (
        isInRegistrationFlow &&
        existingState &&
        existingState.memoryContext
      ) {
        this.logger.debug('Preserving registration flow state', {
          currentStep: existingState.memoryContext.currentStep,
          registrationStep: existingState.memoryContext.registrationState?.step,
        });

        // Make sure we don't lose registration state - explicitly set it
        stateWithMemory.memoryContext = {
          ...stateWithMemory.memoryContext,
          currentProcess: ProcessType.REGISTRATION,
          currentStep: existingState.memoryContext.currentStep || '',
          registrationState: existingState.memoryContext.registrationState,
        };

        // Set next node directly to registration worker to bypass orchestrator decision
        stateWithMemory.next = REGISTRATION_WORKER;
      }
      // If user is already registered, ensure we don't accidentally trigger registration flow
      else if (isRegistered && !stateWithMemory.memoryContext?.currentProcess) {
        this.logger.debug(
          'User is already registered, starting with general assistant process',
          {
            userId,
            threadId,
          },
        );

        // Set current process to general assistant for already registered users
        stateWithMemory.memoryContext = {
          ...stateWithMemory.memoryContext,
          currentProcess: ProcessType.GENERAL_ASSISTANT,
        };
      }

      // Stream the results
      const events = [];
      let lastState = null;

      for await (const event of await workflow.stream(
        stateWithMemory,
        config,
      )) {
        // Apply our deduplication function at each node transition
        if (event && event.messages && Array.isArray(event.messages)) {
          this.ensureCleanState(event as OrchestratorState);
        }

        events.push(event);
        lastState = event;
      }

      // After processing, save the last AI message to memory
      if (lastState) {
        // Ensure we have a clean state before saving
        lastState = this.ensureCleanState(lastState as OrchestratorState);
        await this.tamyMemory.saveAIMessageToMemory(lastState);
      }

      // Return all events for debugging
      return events;
    } catch (error) {
      this.logger.error('Error processing message', error);
      throw error;
    }
  }

  /**
   * Determines the next path to take in the workflow
   */
  branch = async (state: OrchestratorState): Promise<string> => {
    try {
      // Priority 1: If we're in registration process, strictly enforce continuity
      if (
        state.memoryContext?.currentProcess === ProcessType.REGISTRATION &&
        state.memoryContext?.currentStep
      ) {
        this.logger.debug('Enforcing registration process continuity', {
          step: state.memoryContext.currentStep,
        });
        return REGISTRATION_WORKER;
      }

      // Priority 2: Follow the next value if it's set
      if (state.next && state.next !== 'branch') {
        this.logger.debug(`Following next value: ${state.next}`);
        return state.next;
      }

      // Priority 3: Validate user authentication status
      if (!state.isRegistered) {
        this.logger.debug('User not registered, routing to registration');
        return REGISTRATION_WORKER;
      }

      // Priority 4: Check for interrupted processes that need to be resumed
      if (state.memoryContext?.interruptedProcess) {
        this.logger.debug('Resuming interrupted process', {
          type: state.memoryContext.interruptedProcess.type,
        });

        // Map the process type to the appropriate worker
        switch (state.memoryContext.interruptedProcess.type) {
          case ProcessType.REGISTRATION:
            return REGISTRATION_WORKER;
          // Add cases for other process types as needed
          default:
            // If we don't recognize the process type, fallback to general assistant
            return GENERAL_ASSISTANT_WORKER;
        }
      }

      // Default to general assistant for registered users
      this.logger.debug(
        'No special routing conditions, using general assistant',
      );
      return GENERAL_ASSISTANT_WORKER;
    } catch (error) {
      this.logger.error('Error in branch function', {
        error: error instanceof Error ? error.message : String(error),
      });
      return ERROR_HANDLER;
    }
  };
}
