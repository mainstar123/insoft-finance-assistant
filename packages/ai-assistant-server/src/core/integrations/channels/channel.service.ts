import { Injectable, Logger } from '@nestjs/common';
import { BaseChannel } from './base-channel';
import { Channel, ChannelType } from './channel.interface';
import { WhatsAppChannel } from './whatsapp/whatsapp-channel';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);
  private readonly channels: Map<ChannelType, Channel> = new Map();

  constructor(private readonly whatsAppChannel: WhatsAppChannel) {
    this.logger.log('Channel service initialized');
    this.registerChannel(whatsAppChannel);
  }

  /**
   * Register a channel with the service
   * @param channel The channel to register
   */
  registerChannel(channel: BaseChannel): void {
    const channelType = channel.getType();
    this.channels.set(channelType, channel);
    this.logger.log(`Registered channel: ${channelType}`);
  }

  /**
   * Get a channel by type
   * @param type The channel type
   * @returns The channel
   */
  getChannel(type: ChannelType): Channel | undefined {
    return this.channels.get(type);
  }

  /**
   * Get all registered channels
   * @returns An array of channels
   */
  getAllChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Send a message to a specific channel
   * @param channelType The channel type
   * @param to The recipient
   * @param message The message to send
   */
  async sendMessage(
    channelType: ChannelType,
    to: string,
    message: string,
  ): Promise<any> {
    const channel = this.getChannel(channelType);

    if (!channel) {
      throw new Error(`Channel not found: ${channelType}`);
    }

    return channel.sendMessage(to, message);
  }
}
