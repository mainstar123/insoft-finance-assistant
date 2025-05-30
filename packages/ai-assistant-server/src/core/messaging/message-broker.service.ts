import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface UserMessage {
  userPhone: string;
  content: string;
  channelId: string;
  attachments?: any[];
}

export interface AiResponse {
  userPhone: string;
  content: string;
  channelId: string;
  attachments?: any[];
}

@Injectable()
export class MessageBrokerService {
  private readonly logger = new Logger(MessageBrokerService.name);
  private readonly userMessageSubject = new Subject<UserMessage>();
  private readonly aiResponseSubject = new Subject<AiResponse>();

  /**
   * Publish a user message to be processed by AI
   */
  publishUserMessage(message: UserMessage): void {
    // Log the message content and a stack trace to pinpoint the origin
    this.logger.log(`Publishing message: ${JSON.stringify(message)}`);
    console.trace('Publish call stack:');

    if (
      !message ||
      (typeof message === 'object' && Object.keys(message).length === 0)
    ) {
      this.logger.error('Attempting to publish an empty message');
    }
    this.logger.debug(`Publishing user message from ${message.userPhone}`);
    this.userMessageSubject.next(message);
  }

  /**
   * Subscribe to user messages
   */
  onUserMessage(callback: (message: UserMessage) => void): () => void {
    const subscription = this.userMessageSubject.subscribe(callback);
    return () => subscription.unsubscribe();
  }

  /**
   * Publish an AI response to be sent back to the user
   */
  publishAiResponse(response: AiResponse): void {
    // Log the message content and a stack trace to pinpoint the origin
    this.logger.log(`Publishing message: ${JSON.stringify(response)}`);
    console.trace('Publish call stack:');

    if (
      !response ||
      (typeof response === 'object' && Object.keys(response).length === 0)
    ) {
      this.logger.error('Attempting to publish an empty message');
    }
    this.aiResponseSubject.next(response);
  }

  /**
   * Subscribe to AI responses
   */
  onAiResponse(callback: (response: AiResponse) => void): () => void {
    const subscription = this.aiResponseSubject.subscribe(callback);
    return () => subscription.unsubscribe();
  }
}
