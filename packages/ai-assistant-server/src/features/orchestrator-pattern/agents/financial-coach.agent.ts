import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  FINANCIAL_COACH_WORKER,
  InterruptedProcess,
  MemoryContext,
  OrchestratorState,
  OUTPUT_SANITIZER,
  ProcessType,
  REGISTRATION_WORKER
} from '../types';

@Injectable()
export class FinancialCoachWorker {
  private readonly logger = new Logger(FinancialCoachWorker.name);
  private reactAgent;

  constructor() {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
      cache: true,
    });

    // Create tools for financial education
    const getInvestmentInfo = tool(
      (input) => {
        if (input.topic === 'cdb') {
          return 'CDB (Certificado de Depósito Bancário) é um título de renda fixa emitido por bancos como forma de captação de recursos. O investidor empresta dinheiro ao banco e recebe juros sobre esse valor.';
        } else if (input.topic === 'tesouro_direto') {
          return 'Tesouro Direto é um programa do governo brasileiro que permite a compra de títulos públicos por pessoas físicas. É considerado um investimento seguro porque o pagamento é garantido pelo Tesouro Nacional.';
        } else if (input.topic === 'acoes') {
          return 'Ações são pequenas partes de uma empresa que são negociadas na bolsa de valores. Ao comprar ações, você se torna sócio da empresa e pode receber dividendos e lucrar com a valorização das ações.';
        } else if (input.topic === 'fundos_imobiliarios') {
          return 'Fundos Imobiliários (FIIs) são investimentos em que um grupo de investidores reúne recursos para aplicar em empreendimentos imobiliários. Os rendimentos vêm do aluguel desses imóveis e são distribuídos mensalmente.';
        }
        return 'Este é um tipo de investimento comum no Brasil. Para informações mais específicas, por favor pergunte sobre um tipo específico.';
      },
      {
        name: 'get_investment_info',
        description: 'Get information about different investment types',
        schema: z.object({
          topic: z
            .string()
            .describe(
              'The investment topic to get information on (cdb, tesouro_direto, acoes, fundos_imobiliarios, etc)',
            ),
        }),
      },
    );

    const getFinancialConcept = tool(
      (input) => {
        if (input.concept === 'juros_compostos') {
          return 'Juros compostos é quando os juros de um período são adicionados ao capital para o cálculo dos juros do período seguinte. Isso cria um efeito de "bola de neve" que acelera o crescimento do dinheiro ao longo do tempo.';
        } else if (input.concept === 'diversificacao') {
          return 'Diversificação é a estratégia de dividir investimentos entre diferentes tipos de ativos para reduzir o risco. Assim, se um investimento tiver desempenho ruim, outros podem compensar, reduzindo perdas no total.';
        } else if (input.concept === 'inflacao') {
          return 'Inflação é o aumento generalizado e contínuo dos preços de bens e serviços. Ela reduz o poder de compra do dinheiro ao longo do tempo, tornando importante que investimentos superem a inflação para preservar o valor real do capital.';
        }
        return 'Este é um conceito financeiro importante. Para informações mais específicas, por favor pergunte sobre um conceito específico.';
      },
      {
        name: 'get_financial_concept',
        description: 'Get explanations of financial concepts',
        schema: z.object({
          concept: z
            .string()
            .describe(
              'The financial concept to explain (juros_compostos, diversificacao, inflacao, etc)',
            ),
        }),
      },
    );

    // Replace the Portuguese-specific instructions
    const customPrompt = `You are a financial expert who works as a coach for Tamy Finance. Your role is to provide accurate financial education and guidance to users.

Key responsibilities:
1. Explain financial concepts with clarity and precision
2. Provide educational guidance on financial products and services
3. Answer questions about personal finance, investments, and savings
4. Maintain an educational rather than prescriptive focus - help users understand concepts

Important guidelines:
- Maintain a friendly, clear, and educational tone
- Explain concepts without jargon when possible
- If you're unsure about something, openly acknowledge it
- Don't provide specific investment advice
- Focus on general financial education
- Always respond in the same language as the user

Areas of expertise:
- Basic personal finance concepts
- Savings and investment vehicles
- Debt management
- Budgeting principles
- Financial terminology
- General market concepts`;

    // Create the ReAct agent
    this.reactAgent = createReactAgent({
      llm: model,
      tools: [getInvestmentInfo, getFinancialConcept],
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

  async provideFinancialEducation(
    state: OrchestratorState,
    config?: RunnableConfig,
  ): Promise<OrchestratorState> {
    try {
      this.logger.debug('Providing financial education', {
        userId: state.userId,
        threadId: state.threadId,
        isInterruption: this.isInterruptingAnotherProcess(state),
      });

      // Skip if no messages
      if (state.messages.length === 0) {
        return {
          ...state,
          metadata: {
            ...state.metadata,
            lastNode: FINANCIAL_COACH_WORKER,
          },
          next: OUTPUT_SANITIZER,
        };
      }

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
        name: 'FinancialCoach',
      });

      // Prepare the updated memory context
      const updatedMemoryContext: MemoryContext = {
        // Required properties must be included and properly typed
        relevantHistory: state.memoryContext?.relevantHistory || '',
        lastInteraction: new Date(),
        currentStep: isTemporaryDiversion
          ? state.memoryContext?.currentStep || ''
          : 'financial_education',

        // Optional properties
        summary: state.memoryContext?.summary,
        registrationState: state.memoryContext?.registrationState,

        // Store the interrupted process info if we're interrupting something
        interruptedProcess,

        // Set current process only if we're not just temporarily diverting
        currentProcess: isTemporaryDiversion
          ? state.memoryContext?.currentProcess
          : ProcessType.FINANCIAL_EDUCATION,

        // Track the diversion
        lastDiversion: isTemporaryDiversion
          ? {
              from: state.memoryContext?.currentProcess || '',
              to: ProcessType.FINANCIAL_EDUCATION,
              timestamp: new Date(),
            }
          : state.memoryContext?.lastDiversion,
      };

      // Return updated state with the new message
      return {
        ...state,
        messages: [...state.messages, aiMessage],
        metadata: {
          ...state.metadata,
          lastNode: FINANCIAL_COACH_WORKER,
          // If we were in registration, preserve the step
          registrationStep: state.metadata.registrationStep,
          // Flag if this is a temporary diversion
          temporaryDiversion: isTemporaryDiversion,
        },
        next: OUTPUT_SANITIZER,
        memoryContext: updatedMemoryContext,
      };
    } catch (error) {
      this.logger.error('Error in financial coach worker', error);

      // Create a default message when we hit an error
      const defaultResponse =
        'Desculpe, estou tendo dificuldades para processar sua pergunta sobre finanças. Poderia reformular ou fazer outra pergunta sobre educação financeira?';
      const aiMessage = new AIMessage({
        content: defaultResponse,
        name: 'FinancialCoach',
      });

      // Create proper memory context with required properties
      const errorMemoryContext: MemoryContext = {
        // Required properties
        relevantHistory: state.memoryContext?.relevantHistory || '',
        currentStep: state.memoryContext?.currentStep || 'financial_education',
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
          lastError: `Financial coach error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          lastNode: FINANCIAL_COACH_WORKER,
        },
        next: OUTPUT_SANITIZER,
        memoryContext: errorMemoryContext,
      };
    }
  }
}
