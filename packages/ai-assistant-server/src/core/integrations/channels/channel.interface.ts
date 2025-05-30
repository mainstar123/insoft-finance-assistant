/**
 * Enum representing the different types of channels
 */
export enum ChannelType {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  SMS = 'sms',
  WEB = 'web',
}

/**
 * Message format for incoming messages from various channels
 */
export interface IncomingMessage {
  channelId: string;
  userId: string;
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

/**
 * Message format for outgoing messages to various channels
 */
export interface OutgoingMessage {
  channelId: string;
  userId: string;
  content: string;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

/**
 * Attachment format for messages
 */
export interface Attachment {
  type:
    | 'image'
    | 'audio'
    | 'video'
    | 'document'
    | 'location'
    | 'sticker'
    | 'contacts'
    | 'reaction';
  url?: string;
  data?: Buffer;
  metadata?: Record<string, any>;
}

/**
 * Interface for a channel
 */
export interface Channel {
  /**
   * Get the type of channel
   */
  getType(): ChannelType;

  /**
   * Send a message to the channel
   * @param to The recipient
   * @param message The message to send
   */
  sendMessage(to: string, message: string): Promise<any>;

  /**
   * Register a listener for incoming messages
   * @param listener The listener function
   * @returns A function to unsubscribe the listener
   */
  onMessage(listener: (message: any) => void): () => void;
}
