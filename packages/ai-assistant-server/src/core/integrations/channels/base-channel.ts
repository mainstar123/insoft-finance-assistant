import { Logger } from '@nestjs/common';
import { ChannelType } from './channel.interface';

/**
 * Base channel implementation that provides common functionality for all channels
 */
export abstract class BaseChannel {
  private readonly messageListeners: Array<(message: any) => void> = [];
  public readonly logger = new Logger(BaseChannel.name);

  /**
   * Get the type of channel
   */
  abstract getType(): ChannelType;

  /**
   * Send a message to the channel
   * @param to The recipient
   * @param message The message to send
   */
  abstract sendMessage(to: string, message: string): Promise<any>;

  /**
   * Register a listener for incoming messages
   * @param listener The listener function
   * @returns A function to unsubscribe the listener
   */
  onMessage(listener: (message: any) => void): () => void {
    this.messageListeners.push(listener);
    this.logger.debug(
      `Registered message listener, total: ${this.messageListeners.length}`,
    );

    // Return an unsubscribe function
    return () => {
      const index = this.messageListeners.indexOf(listener);
      if (index !== -1) {
        this.messageListeners.splice(index, 1);
        this.logger.debug(
          `Unregistered message listener, total: ${this.messageListeners.length}`,
        );
      }
    };
  }

  /**
   * Emit a message to all registered listeners
   * @param message The message to emit
   */
  protected emitMessage(message: any): void {
    this.logger.debug(
      `Emitting message to ${this.messageListeners.length} listeners`,
    );

    for (const listener of this.messageListeners) {
      try {
        listener(message);
      } catch (error) {
        this.logger.error(
          `Error in message listener: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }
}
