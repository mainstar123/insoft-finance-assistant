import { BaseMessage } from '@langchain/core/messages';
import { StateGraphArgs, Command, Send } from '@langchain/langgraph';
import { ChannelType } from '@/core/integrations/channels/channel.interface';

// Registration steps as an enum (for use as values)
export enum RegistrationSteps {
  // For the registration flow in tools
  BASIC_INFO = 'basic_info',
  PERSONAL_INFO = 'personal_info',
  CONSENT = 'consent',
  COMPLETE = 'complete',

  // Original steps
  COLLECT_NAME = 'collect_name',
  COLLECT_EMAIL = 'collect_email',
  COLLECT_BIRTHDATE = 'collect_birthdate',
  COLLECT_GENDER = 'collect_gender',
  COLLECT_COUNTRY = 'collect_country',
  COLLECT_CONSENT = 'collect_consent',
  CONFIRM = 'confirm',
  COMPLETED = 'completed',
  NAME = 'NAME',
  EMAIL = 'EMAIL',
  CONFIRMATION = 'CONFIRMATION',
}

// Process types for keeping track of different flows
export enum ProcessType {
  REGISTRATION = 'REGISTRATION',
  FINANCIAL_EDUCATION = 'FINANCIAL_EDUCATION',
  GENERAL_ASSISTANT = 'GENERAL_ASSISTANT',
  // Add more process types as needed
}

// Enhanced metadata with validation status
export interface OrchestratorStateMetadata {
  threadId: string;
  channelType: ChannelType;
  userPhone: string;
  registrationStep?: RegistrationSteps;
  inputValidated?: boolean;
  outputValidated?: boolean;
  lastError?: string;
  lastNode?: string;
  routingReason?: string;
  temporaryDiversion?: boolean; // Flag indicating this is a temporary diversion
  awaitingUserInput?: boolean;
  shouldMaintainProcess?: boolean; // Whether to maintain the current process
  interruptType?:
    | 'process_exit'
    | 'registration_exit'
    | 'name_validation'
    | 'email_validation'
    | 'registration_confirmation';
  validationData?: Record<string, any>;
  currentProcess?: ProcessType;
  lastMessage?: string;
  isSystemMessage?: boolean; // Flag to indicate if the message is a system message
  followUpSuggestions?: string[]; // Suggested follow-up questions for the user
  messageBreakdown?: {
    totalMessages: number;
    shouldBreakMessages: boolean;
    contextMaintenance: {
      requiresContext: boolean;
      contextHoldDurationMs?: number;
      contextType?: string;
    };
  };
}

// Registration state for multi-step process
export interface RegistrationState {
  step: RegistrationSteps; // Updated to use enum
  name?: string;
  email?: string;
  isValid?: boolean;
  lastValidationError?: string;
  userId?: string;
  birthDate?: string;
  gender?: string;
  country?: string;
  termsAccepted?: boolean;
  marketingConsent?: boolean;
  confirmed?: boolean;
  confirmationPresented?: boolean;
}

// Information about an interrupted process
export interface InterruptedProcess {
  type: ProcessType;
  returnToAgent: string;
  originalStep: string;
  timestamp: Date;
  data?: any;
}

// Memory context for maintaining history
export interface ProcessDiversion {
  from: string;
  to: string;
  timestamp: Date;
}

export interface LanguagePreference {
  code: string;
  name: string;
  lastDetected: Date;
}

// Memory context interface
export interface MemoryContext {
  relevantHistory: string;
  currentProcess: ProcessType;
  currentStep: string;
  lastInteraction: Date;
  interruptedProcess?: InterruptedProcess;
  processDiversion?: ProcessDiversion;
  languagePreference?: LanguagePreference;
  // Additional properties used across agents
  registrationState?: RegistrationState;
  preferredLanguage?: {
    code: string;
    name: string;
    lastDetected: Date;
  };
  summary?: string;
  lastDiversion?: ProcessDiversion;
  financialKnowledge?:
    | 'NO_KNOWLEDGE'
    | 'BEGINNER'
    | 'INTERMEDIATE'
    | 'ADVANCED'
    | 'EXPERT';
}

// Define our main state object
export interface OrchestratorState {
  messages: any[];
  next?: string;
  userId: string;
  threadId: string;
  isRegistered: boolean;
  metadata: OrchestratorStateMetadata;
  memoryContext: MemoryContext;
}

// Define state channels for LangGraph
export const orchestratorStateChannels: StateGraphArgs<OrchestratorState>['channels'] =
  {
    messages: {
      value: (x?: BaseMessage[], y?: BaseMessage[]) => {
        // IMPORTANT: We changed from concat approach to replacement approach
        // This prevents message duplication as state transitions between nodes
        return y && y.length > 0 ? y : (x ?? []);
      },
      default: () => [],
    },
    next: {
      value: (x?: string, y?: string) => y ?? x ?? '',
      default: () => '',
    },
    userId: {
      value: (x?: string, y?: string) => y ?? x ?? '',
      default: () => '',
    },
    threadId: {
      value: (x?: string, y?: string) => y ?? x ?? '',
      default: () => '',
    },
    isRegistered: {
      value: (x?: boolean, y?: boolean) => y ?? x ?? false,
      default: () => false,
    },
    metadata: {
      value: (
        x?: OrchestratorStateMetadata,
        y?: Partial<OrchestratorStateMetadata>,
      ) => {
        const defaultValue: OrchestratorStateMetadata = {
          threadId: '',
          channelType: ChannelType.WHATSAPP,
          userPhone: '',
          inputValidated: false,
          outputValidated: false,
        };
        return {
          ...defaultValue,
          ...(x || {}),
          ...(y || {}),
        } as OrchestratorStateMetadata;
      },
      default: () => ({
        threadId: '',
        channelType: ChannelType.WHATSAPP,
        userPhone: '',
        inputValidated: false,
        outputValidated: false,
      }),
    },
    memoryContext: {
      value: (x?: MemoryContext, y?: Partial<MemoryContext>) => {
        const defaultValue: MemoryContext = {
          relevantHistory: '',
          currentProcess: ProcessType.GENERAL_ASSISTANT,
          currentStep: 'general_assistant',
          lastInteraction: new Date(),
        };
        return {
          ...defaultValue,
          ...(x || {}),
          ...(y || {}),
        } as MemoryContext;
      },
      default: () => ({
        relevantHistory: '',
        currentProcess: ProcessType.GENERAL_ASSISTANT,
        currentStep: 'general_assistant',
        lastInteraction: new Date(),
      }),
    },
  };

// Available graph nodes
export const ORCHESTRATOR = 'orchestrator';
export const INPUT_SANITIZER = 'input_sanitizer';
export const OUTPUT_SANITIZER = 'output_sanitizer';
export const REGISTRATION_WORKER = 'registration_worker';
export const FINANCIAL_COACH_WORKER = 'financial_coach_worker';
export const GENERAL_ASSISTANT_WORKER = 'general_assistant_worker';
export const ERROR_HANDLER = 'error_handler';

// Common node type
export type OrchestratorNodes =
  | typeof ORCHESTRATOR
  | typeof INPUT_SANITIZER
  | typeof OUTPUT_SANITIZER
  | typeof REGISTRATION_WORKER
  | typeof FINANCIAL_COACH_WORKER
  | typeof GENERAL_ASSISTANT_WORKER
  | typeof ERROR_HANDLER;

export interface RoutingDecision {
  routeTo: string;
  reasoning: string;
}

// Command types for interrupts
export interface InterruptCommand extends Command<unknown> {
  type: 'interrupt';
  value: {
    message: string;
    requiresConfirmation: boolean;
    processType?: ProcessType;
    step?: string;
  };
  metadata?: {
    originalProcess?: ProcessType;
    originalStep?: string;
    timestamp: Date;
  };
  update?: [string, any][] | Record<string, any>;
  resume?: unknown;
  goto: string | Send | (string | Send)[];
  lg_name: string;
  lc_direct_tool_output: boolean;
  _updateAsTuples: () => [string, unknown][];
  toJSON(): {
    update: Record<string, unknown> | [string, unknown][] | undefined;
    resume: unknown;
    goto:
      | string
      | { node: string; args: any }
      | (string | { node: string; args: any })[];
  };
}

export interface ResumeCommand extends Command<unknown> {
  type: 'resume';
  value: {
    confirmed: boolean;
    userInput?: string;
    processType: ProcessType;
    step: string;
  };
  metadata?: {
    timestamp: Date;
  };
  update?: [string, any][] | Record<string, any>;
  resume?: unknown;
  goto: string | Send | (string | Send)[];
  lg_name: string;
  lc_direct_tool_output: boolean;
  _updateAsTuples: () => [string, unknown][];
  toJSON(): {
    update: Record<string, unknown> | [string, unknown][] | undefined;
    resume: unknown;
    goto:
      | string
      | { node: string; args: any }
      | (string | { node: string; args: any })[];
  };
}

// Helper functions for creating commands
export function createInterruptCommand(
  message: string,
  requiresConfirmation: boolean,
  processType?: ProcessType,
  step?: string,
  originalProcess?: ProcessType,
  originalStep?: string,
): InterruptCommand {
  return {
    type: 'interrupt',
    value: {
      message,
      requiresConfirmation,
      processType,
      step,
    },
    metadata: {
      originalProcess,
      originalStep,
      timestamp: new Date(),
    },
    update: [],
    resume: undefined,
    goto: '',
    lg_name: 'interrupt',
    lc_direct_tool_output: false,
    _updateAsTuples: () => [],
    toJSON() {
      return {
        update: this.update,
        resume: this.resume,
        goto: this.goto,
      };
    },
  };
}

export function createResumeCommand(
  confirmed: boolean,
  userInput?: string,
  processType?: ProcessType,
  step?: string,
): ResumeCommand {
  const finalProcessType = processType || ProcessType.GENERAL_ASSISTANT;
  const finalStep = step || 'general_assistant';

  return {
    type: 'resume',
    value: {
      confirmed,
      userInput,
      processType: finalProcessType,
      step: finalStep,
    },
    metadata: {
      timestamp: new Date(),
    },
    update: [],
    resume: undefined,
    goto: '',
    lg_name: 'resume',
    lc_direct_tool_output: false,
    _updateAsTuples: () => [],
    toJSON() {
      return {
        update: this.update,
        resume: this.resume,
        goto: this.goto,
      };
    },
  };
}

// Default memory context factory
export function createDefaultMemoryContext(
  processType: ProcessType = ProcessType.GENERAL_ASSISTANT,
  step: string = 'general_assistant',
): MemoryContext {
  return {
    relevantHistory: '',
    currentProcess: processType,
    currentStep: step,
    lastInteraction: new Date(),
  };
}

// Update getInitialMemoryContext to use the new factory
export function getInitialMemoryContext(): MemoryContext {
  return createDefaultMemoryContext();
}

// Type guards for safer state access
export function isRegistrationState(
  value: unknown,
): value is RegistrationState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'step' in value &&
    typeof (value as RegistrationState).step === 'string'
  );
}

export function hasRegistrationState(
  context: MemoryContext,
): context is MemoryContext & { registrationState: RegistrationState } {
  return (
    'registrationState' in context &&
    isRegistrationState(context.registrationState)
  );
}

export function hasPreferredLanguage(
  context: MemoryContext,
): context is MemoryContext & {
  preferredLanguage: { code: string; name: string; lastDetected: Date };
} {
  return (
    'preferredLanguage' in context &&
    typeof context.preferredLanguage === 'object' &&
    context.preferredLanguage !== null &&
    'code' in context.preferredLanguage &&
    'name' in context.preferredLanguage &&
    'lastDetected' in context.preferredLanguage
  );
}

export function isInterruptedProcess(
  value: unknown,
): value is InterruptedProcess {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'returnToAgent' in value &&
    'originalStep' in value &&
    'timestamp' in value
  );
}

export function hasInterruptedProcess(
  context: MemoryContext,
): context is MemoryContext & { interruptedProcess: InterruptedProcess } {
  return (
    'interruptedProcess' in context &&
    isInterruptedProcess(context.interruptedProcess)
  );
}

export interface StructuredMessage {
  content: string;
  delayMs: number;
  messageType: string;
  isStandalone: boolean;
}

// Update AiResponse interface to include metadata
export interface AiResponseMetadata {
  messageType: string;
  isTyping: boolean;
}

export interface AiResponse {
  userPhone: string;
  content: string;
  channelId: string;
  attachments: any[];
  metadata?: AiResponseMetadata;
}
