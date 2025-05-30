import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { OrchestratorState } from '../types';
import { AIMessage, isAIMessage } from '@langchain/core/messages';
import { END } from '@langchain/langgraph';
import { z } from 'zod';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { hasPreferredLanguage } from '../types';

// Define message types for different contexts
const MessageType = z.enum([
  'GREETING',
  'EXPLANATION',
  'INSTRUCTION',
  'CONFIRMATION',
  'WARNING',
  'ERROR',
  'FOLLOW_UP',
  'SUMMARY',
  'STEP',
  'EXAMPLE',
  'TIP',
]);

// Define domain-specific categories
const DomainCategory = z.enum([
  'GENERAL',
  'FINANCIAL_EDUCATION',
  'ACCOUNT_MANAGEMENT',
  'BUDGETING',
  'INVESTMENT',
  'SAVINGS',
  'DEBT_MANAGEMENT',
  'REGISTRATION',
  'ERROR_HANDLING',
]);

// Update the ResponseSchema to include message grouping and dependencies
const ResponseSchema = z.object({
  messages: z.array(
    z.object({
      content: z.string().describe('The transformed message content'),
      type: MessageType.describe('The type of message'),
      domain: DomainCategory.describe('The domain category'),
      order: z.number().describe('Order in sequence'),
      groupId: z.string().optional().describe('Group ID for related messages'),
      dependsOn: z
        .array(z.string())
        .optional()
        .describe('IDs of messages this depends on'),
      isStandalone: z
        .boolean()
        .describe('Whether this message can be sent independently'),
      delayAfterMs: z.number().optional().describe('Delay after this message'),
    }),
  ),
  context: z.object({
    shouldBreakMessages: z.boolean(),
    requiresFollowUp: z.boolean().optional(),
    emotionalContext: z.string().optional(),
    messageGroups: z
      .array(
        z.object({
          id: z.string(),
          type: z.string(),
          minDelayBetweenMs: z.number(),
        }),
      )
      .optional(),
  }),
});

@Injectable()
export class OutputSanitizerAgent {
  private readonly logger = new Logger(OutputSanitizerAgent.name);
  private reactAgentModel: ChatOpenAI;
  private readonly DEFAULT_DELAY = 1000; // 1 second base delay
  private readonly CHAR_DELAY_FACTOR = 20; // ms per character for reading time

  constructor() {
    this.reactAgentModel = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
      cache: true,
    });
  }

  private formatWhatsAppMessage(content: string): string {
    return (
      content
        // Convert markdown bold to WhatsApp bold
        .replace(/\*\*(.*?)\*\*/g, '*$1*')
        // Convert markdown italic to WhatsApp italic
        .replace(/_(.*?)_/g, '_$1_')
        // Convert markdown code to WhatsApp monospace
        .replace(/`(.*?)`/g, '```$1```')
        // Convert markdown links to text format
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1: $2')
        // Convert markdown headers to bold
        .replace(/^#\s+(.*?)$/gm, '*$1*')
        // Convert numbered lists to bullet points
        .replace(/^\d+\.\s+/gm, '• ')
    );
  }

  private async createOutputSanitizerAgent(
    llm: ChatOpenAI,
    state: OrchestratorState,
  ) {
    const currentProcess = state.memoryContext?.currentProcess || '';
    const knowledgeLevel =
      state.memoryContext?.financialKnowledge || 'BEGINNER';
    const defaultLanguage = {
      code: 'pt-BR',
      name: 'Brazilian Portuguese',
      lastDetected: new Date(),
    };
    const language = hasPreferredLanguage(state.memoryContext)
      ? state.memoryContext.preferredLanguage
      : defaultLanguage;
    console.log('🚀 ~ OutputSanitizerAgent ~ language:', language);

    const recentMessages = state.messages
      .slice(-3)
      .map((m) => `${isAIMessage(m) ? 'Assistant' : 'User'}: ${m.content}`)
      .join('\n');

    const basePrompt = `You are Tamy, a modern and friendly AI financial assistant focused on helping Brazilians manage their finances. Your task is to transform messages to match your unique personality and style.

TAMY'S CORE PERSONALITY:
- Modern, extroverted, yet wise financial mentor
- Uses pop culture references while maintaining credibility
- Digital native focused (age 23-33)
- Personal financial guide who builds trust
- ALWAYS communicates in the user's preferred language (currently: ${language.name} ${language.code})
- Uses emojis naturally, especially the brand's purple heart 💜

WHATSAPP FORMATTING RULES:
- Use *text* for bold (important points)
- Use _text_ for italics (emphasis)
- Keep messages under 1500 characters
- Use emojis contextually and naturally
- Add line breaks for readability

CURRENT CONTEXT:
- Process: ${currentProcess}
- Knowledge Level: ${knowledgeLevel}
- Language: ${language.name} (${language.code})
- Recent Messages:
${recentMessages}

YOUR TASK:
1. Transform the input message into Tamy's style while maintaining the core meaning
2. Add appropriate emojis and WhatsApp formatting
3. Break long messages into digestible chunks if needed
4. Maintain a friendly, encouraging tone
5. Always end important messages with Tamy's signature purple heart 💜

Remember:
- Use "eu" instead of "Tamy" in Portuguese
- Use "I" instead of "Tamy" in English
- Keep financial terms simple and relatable
- Add encouragement naturally
- Use expressions appropriate to the chosen language
- Consider the emotional context of financial discussions`;

    return createReactAgent({
      llm,
      tools: [],
      prompt: basePrompt,
      responseFormat: {
        schema: ResponseSchema,
        prompt: `Transform the message into Tamy's style. Break into chunks if needed.`,
      },
    });
  }

  async processOutput(state: OrchestratorState): Promise<OrchestratorState> {
    console.log('🚀 ~ OutputSanitizerAgent ~ processOutput ~ state:', state);
    try {
      if (state.messages.length === 0) {
        return this.finalizeState(state);
      }

      const lastMessage = state.messages[state.messages.length - 1];
      if (!isAIMessage(lastMessage)) {
        return this.finalizeState(state);
      }

      try {
        const agent = await this.createOutputSanitizerAgent(
          this.reactAgentModel,
          state,
        );

        // Use the same language detection logic as in createOutputSanitizerAgent
        const defaultLanguage = {
          code: 'pt-BR',
          name: 'Brazilian Portuguese',
          lastDetected: new Date(),
        };
        const language = hasPreferredLanguage(state.memoryContext)
          ? state.memoryContext.preferredLanguage
          : defaultLanguage;

        console.log(
          '🚀 ~ OutputSanitizerAgent ~ processOutput ~ language:',
          language,
        );
        const result = await agent.invoke({
          messages: [
            {
              role: 'user',
              content: `Transform this message: ${lastMessage.content}, in the user's preferred language: ${language.name} (${language.code})`,
            },
          ],
        });
        console.log(
          '🚀 ~ OutputSanitizerAgent ~ processOutput ~ result:',
          result,
        );

        if (result?.structuredResponse) {
          const response = result.structuredResponse;

          // Use the original structuredResponse messages directly
          // This ensures we use the English response when English is detected
          state.messages.pop();

          // Create AIMessages from the structured response
          const processedMessages = response.messages.map((msg, index) => {
            // Format for WhatsApp
            const formattedContent = this.formatWhatsAppMessage(msg.content);

            // Create AIMessage
            return new AIMessage({
              content: formattedContent,
              name: lastMessage.name,
              additional_kwargs: {
                ...lastMessage.additional_kwargs,
                messageType: msg.type,
                domain: msg.domain,
                order: index + 1,
                groupId: msg.groupId,
                isStandalone: msg.isStandalone,
                delayMs: 0, // We'll handle delays differently
                language,
              },
            });
          });

          // Add all processed messages to state
          state.messages.push(...processedMessages);

          // Update metadata
          state.metadata = {
            ...state.metadata,
            messageBreakdown: {
              totalMessages: processedMessages.length,
              shouldBreakMessages: response.context.shouldBreakMessages,
              contextMaintenance: {
                requiresContext: response.context.requiresFollowUp || false,
                contextType: 'follow_up',
              },
            },
          };
        } else {
          this.logger.warn(
            'No structured response from agent, using original message',
          );
          state.messages[state.messages.length - 1] = new AIMessage({
            content: lastMessage.content,
            name: lastMessage.name,
            additional_kwargs: {
              ...lastMessage.additional_kwargs,
              language,
            },
          });
        }
      } catch (error) {
        this.logger.error('Error in agent processing', { error });
        state.messages[state.messages.length - 1] = new AIMessage({
          content: lastMessage.content,
          name: lastMessage.name,
          additional_kwargs: {
            ...lastMessage.additional_kwargs,
            processingError:
              error instanceof Error ? error.message : String(error),
          },
        });
      }

      return this.finalizeState(state);
    } catch (error) {
      this.logger.error('Error in output sanitizer agent', { error });
      return {
        ...state,
        metadata: {
          ...state.metadata,
          lastError: `Output processing error: ${error instanceof Error ? error.message : String(error)}`,
          lastNode: 'output_sanitizer',
        },
        next: END,
      };
    }
  }

  private finalizeState(state: OrchestratorState): OrchestratorState {
    return {
      ...state,
      metadata: {
        ...state.metadata,
        outputValidated: true,
        lastNode: 'output_sanitizer',
      },
      next: END,
    };
  }
}
