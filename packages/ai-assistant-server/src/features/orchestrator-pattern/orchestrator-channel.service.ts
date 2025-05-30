import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { WorkflowService } from './graph/workflow';
import { ChannelType } from '@/core/integrations/channels/channel.interface';
import { UserService } from '@/features/user/user.service';
import {
  MessageBrokerService,
  UserMessage,
} from '@/core/messaging/message-broker.service';
import { ThreadManagerService } from './thread/thread-manager.service';
import { StructuredMessage, AiResponse } from './types';

@Injectable()
export class OrchestratorChannelService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(OrchestratorChannelService.name);
  private unsubscribeCallback: (() => void) | null = null;

  constructor(
    private readonly workflowService: WorkflowService,
    private readonly messageBroker: MessageBrokerService,
    private readonly userService: UserService,
    private readonly threadManager: ThreadManagerService,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing Orchestrator Channel Service');
    // Subscribe to message broker for user messages
    this.unsubscribeCallback = this.messageBroker.onUserMessage(
      this.handleUserMessage.bind(this),
    );
    this.logger.log('Orchestrator Channel Service initialized');
  }

  onModuleDestroy() {
    if (this.unsubscribeCallback) {
      this.unsubscribeCallback();
    }
  }

  private validateInput(input: string): void {
    if (!input?.trim()) {
      throw new Error('Input is required and cannot be empty');
    }
  }

  private async sendMessagesInOrder(
    messages: StructuredMessage[],
    userPhone: string,
    channelId: string,
  ): Promise<void> {
    let cumulativeDelay = 0;
    const BASE_DELAY = 500; // Base delay between messages

    for (let i = 0; i < messages.length; i++) {
      const currentMessage = messages[i];
      if (!currentMessage || !currentMessage.content) {
        this.logger.warn('Skipping message with no content', {
          message: currentMessage,
        });
        continue; // Skip if message is invalid or has no content
      }

      // Calculate message delay based on content length
      const messageLength = currentMessage.content.length;
      const typingDelay = Math.min(messageLength * 20, 2000); // 20ms per char, max 2s
      // Combine base delay, calculated typing delay, and any specific delay from the message
      const totalDelay =
        BASE_DELAY + typingDelay + (currentMessage.delayMs || 0);

      // Add to cumulative delay for scheduling
      cumulativeDelay += totalDelay;

      // Schedule message sending using the cumulative delay
      await new Promise((resolve) => setTimeout(resolve, totalDelay));

      // Send the actual message content
      const aiResponse: AiResponse = {
        userPhone,
        content: currentMessage.content,
        channelId,
        attachments: [], // Initialize attachments as empty array
        metadata: {
          messageType: currentMessage.messageType, // Use messageType from StructuredMessage
          isTyping: false, // Explicitly set to false as we are sending content
          // No other metadata is directly available on StructuredMessage
        },
      };

      // Publish the response to the message broker
      this.messageBroker.publishAiResponse(aiResponse);

      this.logger.debug('Published AI response', {
        userPhone,
        channelId,
        responseLength: currentMessage.content.length,
        messageType: currentMessage.messageType,
        // Log the delay applied *before* this message was sent
        delayAppliedMs: totalDelay,
      });
    }
  }

  async handleUserMessage(message: UserMessage): Promise<void> {
    try {
      // Validate message content
      this.validateInput(message.content);

      // Validate channel type
      const channelType = message.channelId as ChannelType;
      if (!Object.values(ChannelType).includes(channelType)) {
        throw new Error(`Invalid channel type: ${message.channelId}`);
      }

      this.logger.debug('Processing user message with orchestrator pattern', {
        userPhone: message.userPhone,
        channelId: channelType,
        content:
          message.content?.length > 50
            ? `${message.content.substring(0, 50)}...`
            : message.content,
        attachments: message.attachments?.length ?? 0,
      });

      // Get or create thread ID
      let threadId: string;
      threadId = await this.threadManager.getOrCreateThreadId(
        message.userPhone,
        channelType,
      );

      // Check if user is registered
      const user = await this.userService.findByPhoneNumber(message.userPhone);
      let isRegistered = false;

      if (user) {
        // User exists in the database, check if registration is complete
        const userRegStatus = await this.userService.validateRegistration(
          user.id,
        );
        isRegistered = userRegStatus.isComplete;

        this.logger.debug('User registration status checked', {
          userId: user.id,
          isRegistered,
          missingSteps: userRegStatus.isComplete
            ? []
            : userRegStatus.missingSteps,
        });
      } else {
        // No user record yet
        this.logger.debug('No user record found for phone number', {
          userPhone: message.userPhone,
        });
      }

      // Get the stored conversation state
      try {
        const state = await this.workflowService.getThreadState(threadId);
        console.log('🚀 ~ handleUserMessage ~ state:', state);

        // Check if we have too many messages and need to reset the thread
        if (state && state.messages && state.messages.length > 30) {
          this.logger.warn(
            `Thread has ${state.messages.length} messages, checking if reset is needed`,
          );

          // If message count exceeds threshold, create a new thread
          // Reset happens by generating a completely new thread ID
          if (state.messages.length > 30) {
            const newThreadId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            await this.threadManager.set(
              `thread:${message.userPhone}:${channelType}`,
              newThreadId,
            );

            this.logger.log(
              `Thread was reset due to message overflow. Old ID: ${threadId}, New ID: ${newThreadId}`,
            );
            threadId = newThreadId;
          }
        }
      } catch (err) {
        // It's okay if we can't get the state, we'll just continue with the current thread
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.debug(`Couldn't retrieve thread state: ${errorMessage}`);
      }
      console.log('🚀 ~ handleUserMessage ~ threadId:', threadId);

      // Process message with our orchestrator pattern workflow
      const events = await this.workflowService.processMessage(
        message.userPhone,
        threadId,
        message.content,
        isRegistered,
      );
      console.log('🚀 ~ handleUserMessage ~ events:', events);

      this.logger.debug('Message processing completed', {
        userPhone: message.userPhone,
        threadId,
        eventsLength: events.length,
      });

      // Extract response from events
      const responses = this.extractResponseFromEvents(events);
      console.log('🚀 ~ handleUserMessage ~ responses:', responses);

      // Send responses in order with proper delays
      await this.sendMessagesInOrder(
        responses,
        message.userPhone,
        message.channelId,
      );
    } catch (error) {
      console.log('🚀 ~ handleUserMessage ~ error:', error);
      this.logger.error(
        `Error handling user message: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Determine language for error message (simple approach)
      const content = message?.content || '';
      const isPortuguese = this.seemsPortuguese(content);

      // Send more user-friendly fallback message in case of error
      this.messageBroker.publishAiResponse({
        userPhone: message.userPhone,
        content: isPortuguese
          ? 'Desculpe, encontrei um problema temporário. Por favor, tente novamente em alguns minutos ou envie uma mensagem diferente.'
          : 'I apologize, but I encountered a temporary issue. Please try again in a few minutes or send a different message.',
        channelId: message.channelId,
        attachments: [],
      });
    }
  }

  /**
   * Simple heuristic to detect if a message is likely in Portuguese
   */
  private seemsPortuguese(text: string): boolean {
    if (!text) return false;

    const normalized = text.toLowerCase();

    // Check for Portuguese-specific words
    const ptWords = [
      'olá',
      'oi',
      'bom dia',
      'boa tarde',
      'boa noite',
      'como vai',
      'obrigado',
      'obrigada',
      'por favor',
      'sim',
      'não',
      'ajuda',
    ];

    if (ptWords.some((word) => normalized.includes(word))) {
      return true;
    }

    // Check for Portuguese-specific characters
    const ptCharacters = [
      'ç',
      'ã',
      'õ',
      'á',
      'é',
      'í',
      'ó',
      'ú',
      'â',
      'ê',
      'ô',
    ];

    return ptCharacters.some((char) => normalized.includes(char));
  }

  private extractResponseFromEvents(events: any[]): StructuredMessage[] {
    try {
      this.logger.debug(`Extracting response from ${events.length} events`);

      // First check output_sanitizer which should have the final response
      for (const event of events) {
        // Check output_sanitizer messages first (this should contain the final response)
        if (event.output_sanitizer?.messages) {
          const messages = event.output_sanitizer.messages;
          if (Array.isArray(messages) && messages.length > 0) {
            // Filter out human messages and get only AI messages
            const aiMessages = messages.filter((msg) => {
              const isAiMessage = msg._getType && msg._getType() === 'ai';
              return isAiMessage;
            });

            if (aiMessages.length > 0) {
              // Sort messages by order if available
              const sortedMessages = aiMessages.sort((a, b) => {
                const orderA = a.additional_kwargs?.order ?? 0;
                const orderB = b.additional_kwargs?.order ?? 0;
                return orderA - orderB;
              });

              // Extract content and metadata
              return sortedMessages.map((msg) => {
                const content = msg.content;
                const metadata = msg.additional_kwargs || {};

                // Add delay if specified
                if (metadata.delayMs) {
                  return {
                    content,
                    delayMs: metadata.delayMs,
                    messageType: metadata.messageType,
                    isStandalone: metadata.isStandalone ?? true,
                  };
                }

                return {
                  content,
                  delayMs: 0,
                  messageType: metadata.messageType,
                  isStandalone: metadata.isStandalone ?? true,
                };
              });
            }
          }
        }

        // Check worker messages if output_sanitizer didn't have a valid response
        const workerMessages =
          event.registration_worker?.messages ||
          event.financial_coach_worker?.messages ||
          event.general_assistant_worker?.messages;

        if (workerMessages) {
          const messages = Array.isArray(workerMessages) ? workerMessages : [];
          const aiMessages = messages.filter((msg) => {
            const isAiMessage = msg._getType && msg._getType() === 'ai';
            return isAiMessage;
          });

          if (aiMessages.length > 0) {
            return aiMessages.map((msg) => ({
              content: msg.content,
              delayMs: 0,
              messageType: 'GENERAL',
              isStandalone: true,
            }));
          }
        }

        // Check for interrupts which contain responses
        if (event.__interrupt__) {
          const interruptValue = event.__interrupt__[0]?.value;
          if (interruptValue) {
            const content =
              typeof interruptValue === 'string'
                ? interruptValue
                : interruptValue.message;

            if (content) {
              return [
                {
                  content,
                  delayMs: 0,
                  messageType: 'INTERRUPT',
                  isStandalone: true,
                },
              ];
            }
          }
        }
      }

      // Default response if nothing else found - detect language from events if possible
      const lastMessage = this.tryExtractLastUserMessage(events);
      const isPortuguese = this.seemsPortuguese(lastMessage);

      return [
        {
          content: isPortuguese
            ? 'Olá! Estou aqui para ajudar com suas questões financeiras. Como posso auxiliar você hoje?'
            : "Hello! I'm here to help with your financial questions. How can I assist you today?",
          delayMs: 0,
          messageType: 'GREETING',
          isStandalone: true,
        },
      ];
    } catch (error) {
      this.logger.error(
        `Error extracting response from events: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return [
        {
          content:
            'Desculpe, ocorreu um erro. Como posso ajudar você com suas finanças hoje?',
          delayMs: 0,
          messageType: 'ERROR',
          isStandalone: true,
        },
      ];
    }
  }

  /**
   * Try to extract the last user message to help with language detection
   */
  private tryExtractLastUserMessage(events: any[]): string {
    for (const event of events) {
      // Try each possible message container
      const messageContainers = [
        event.messages,
        event.output_sanitizer?.messages,
        event.registration_worker?.messages,
        event.financial_coach_worker?.messages,
        event.general_assistant_worker?.messages,
      ];

      for (const container of messageContainers) {
        if (Array.isArray(container)) {
          // Look for the last human message
          for (let i = container.length - 1; i >= 0; i--) {
            const msg = container[i];
            if (!msg) continue;

            const isHumanMessage =
              (msg._getType &&
                typeof msg._getType === 'function' &&
                msg._getType() === 'human') ||
              (msg.role && msg.role === 'user');

            if (isHumanMessage && typeof msg.content === 'string') {
              return msg.content;
            }
          }
        }
      }
    }

    return '';
  }
}
