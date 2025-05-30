import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../core/integrations/redis/redis.service';
import { ChannelType } from '../../../core/integrations/channels/channel.interface';

export interface ThreadMetadata {
  threadId: string;
  userPhone: string;
  channelType: string;
  lastInteraction: number;
  messageCount: number;
}

@Injectable()
export class ThreadManagerService {
  private readonly logger = new Logger(ThreadManagerService.name);
  private readonly defaultTTL: number;
  private readonly MAX_SAFE_MESSAGE_COUNT = 30; // Set a safe limit well below OpenAI's maximum

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.defaultTTL = this.configService.get<number>('THREAD_TTL', 86400); // 24 hours
  }

  /**
   * Get a value from Redis
   * @param key The key to get
   * @returns The value if found, null otherwise
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.redisService.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in Redis with optional TTL
   * @param key The key to set
   * @param value The value to set
   * @param ttl Optional TTL in seconds
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await this.redisService.set(key, value, ttl || this.defaultTTL);
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
    }
  }

  /**
   * Get or create a thread ID for a user
   * @param userPhone The user's phone number
   * @param channelType The channel type
   * @returns The thread ID
   */
  async getOrCreateThreadId(
    userPhone: string,
    channelType: ChannelType,
  ): Promise<string> {
    const key = `thread:${userPhone}:${channelType}`;

    try {
      // Try to get existing thread ID
      const existingId = await this.get(key);
      if (existingId) {
        return existingId;
      }

      // Create new thread ID
      const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      await this.set(key, newId);

      return newId;
    } catch (error) {
      this.logger.error('Error managing thread ID:', error);
      // Fallback to temporary thread ID if Redis fails
      return `temp-${Date.now()}`;
    }
  }

  /**
   * Increment the message count for a thread and reset if needed
   * @param threadId The thread ID
   * @param messageCount Current number of messages in the thread
   * @returns New threadId if reset was needed, original threadId otherwise
   */
  async checkAndResetThreadIfNeeded(
    userPhone: string,
    channelType: ChannelType,
    messageCount: number,
  ): Promise<string> {
    const key = `thread:${userPhone}:${channelType}`;

    // If message count is below the safe threshold, no action needed
    if (messageCount < this.MAX_SAFE_MESSAGE_COUNT) {
      return await this.getOrCreateThreadId(userPhone, channelType);
    }

    try {
      this.logger.warn(
        `Thread message count (${messageCount}) exceeds safe limit (${this.MAX_SAFE_MESSAGE_COUNT}). Resetting thread.`,
        {
          userPhone,
          channelType,
        },
      );

      // Reset by creating a new thread ID
      const newThreadId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Store metadata about the reset for debugging
      const resetKey = `thread_reset:${userPhone}:${Date.now()}`;
      const resetInfo = JSON.stringify({
        oldThreadId: await this.get(key),
        newThreadId,
        messageCount,
        resetTimestamp: Date.now(),
      });

      await this.redisService.set(resetKey, resetInfo, 86400 * 7); // Keep reset info for 7 days

      // Update the thread ID
      await this.set(key, newThreadId);

      this.logger.log(`Thread reset successful. New ID: ${newThreadId}`, {
        userPhone,
        channelType,
      });

      return newThreadId;
    } catch (error) {
      this.logger.error('Error resetting thread:', error);
      // Return existing ID on error
      return await this.getOrCreateThreadId(userPhone, channelType);
    }
  }

  /**
   * Get the remaining time for a thread
   * @param userPhone The user's phone number
   * @returns The remaining time in seconds, or -1 if not found
   */
  async getThreadTimeRemaining(userPhone: string): Promise<number> {
    try {
      const key = `thread:${userPhone}:*`;
      const ttl = await this.redisService.ttl(key);
      return ttl;
    } catch (error) {
      this.logger.error('Error getting thread time remaining:', error);
      return -1;
    }
  }

  /**
   * Gets thread metadata for a user
   */
  async getThreadMetadata(userPhone: string): Promise<ThreadMetadata | null> {
    const key = `thread:${userPhone}:*`;
    const data = await this.redisService.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Explicitly ends a thread
   */
  async endThread(userPhone: string): Promise<void> {
    const key = `thread:${userPhone}:*`;
    await this.redisService.del(key);
  }
}
