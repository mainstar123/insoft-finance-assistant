# Communication Channels

## Overview

The Communication Channels system provides a unified interface for interacting with users across different platforms. It abstracts away the specifics of each platform, allowing the core system to focus on business logic rather than communication details.

## Architecture

The Communication Channels system follows a modular architecture with the following components:

### Channel Interface

The Channel interface defines the contract that all communication channels must implement:

```typescript
export interface Channel {
  name: string;
  initialize(): Promise<void>;
  sendMessage(message: OutgoingMessage): Promise<void>;
  formatMessage(content: string): string;
  handleIncomingMessage(message: any): Promise<IncomingMessage>;
}
```

### Base Channel

The BaseChannel class provides common functionality for all channels:

```typescript
export abstract class BaseChannel implements Channel {
  constructor(protected readonly name: string) {}

  abstract initialize(): Promise<void>;
  abstract sendMessage(message: OutgoingMessage): Promise<void>;
  abstract formatMessage(content: string): string;
  abstract handleIncomingMessage(message: any): Promise<IncomingMessage>;
}
```

### Channel Service

The ChannelService manages all registered channels and routes messages to the appropriate channel:

```typescript
@Injectable()
export class ChannelService implements OnModuleInit {
  private readonly logger = new Logger(ChannelService.name);
  private readonly channels = new Map<string, Channel>();

  constructor(
    private readonly whatsappChannel: WhatsAppChannel,
    private readonly aiOrchestratorService: AiOrchestratorService,
  ) {}

  onModuleInit() {
    this.registerChannel(this.whatsappChannel);
    this.initializeAllChannels();
  }

  registerChannel(channel: Channel): void {
    this.logger.log(`Registering channel: ${channel.name}`);
    this.channels.set(channel.name.toLowerCase(), channel);

    // Set up message handler for this channel
    channel.handleIncomingMessage = this.handleIncomingMessage.bind(this);
  }

  async initializeAllChannels(): Promise<void> {
    for (const [name, channel] of this.channels.entries()) {
      try {
        await channel.initialize();
        this.logger.log(`Channel ${name} initialized successfully`);
      } catch (error) {
        this.logger.error(`Failed to initialize channel ${name}:`, error);
      }
    }
  }

  async sendMessage(message: OutgoingMessage): Promise<void> {
    const { channelId, userId, content } = message;
    const channel = this.channels.get(channelId.toLowerCase());

    if (!channel) {
      this.logger.error(`Channel ${channelId} not found`);
      throw new Error(`Channel ${channelId} not found`);
    }

    try {
      await channel.sendMessage({ channelId, userId, content });
    } catch (error) {
      this.logger.error(`Failed to send message to ${channelId}:`, error);
      throw error;
    }
  }

  async handleIncomingMessage(message: IncomingMessage): Promise<void> {
    try {
      // Process the message using the AI orchestrator
      await this.aiOrchestratorService.processMessage(
        message.userId,
        message.content,
      );
    } catch (error) {
      this.logger.error('Error processing incoming message:', error);
    }
  }

  getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId.toLowerCase());
  }

  formatMessage(channelId: string, content: string): string {
    const channel = this.channels.get(channelId.toLowerCase());
    if (!channel) {
      this.logger.warn(`Channel ${channelId} not found, returning unformatted content`);
      return content;
    }
    return channel.formatMessage(content);
  }
}
```

### Channels Module

The ChannelsModule integrates the channel components with the rest of the system:

```typescript
@Module({
  imports: [ConfigModule, AiOrchestratorModule],
  providers: [ChannelService, WhatsAppChannel],
  exports: [ChannelService],
})
export class ChannelsModule {}
```

## Implemented Channels

### WhatsApp Channel

The WhatsAppChannel implements the Channel interface for WhatsApp:

```typescript
@Injectable()
export class WhatsAppChannel extends BaseChannel {
  private readonly logger = new Logger(WhatsAppChannel.name);
  private client: any; // Placeholder for the actual WhatsApp client

  constructor(private readonly configService: ConfigService) {
    super('WhatsApp');
  }

  async initialize(): Promise<void> {
    try {
      this.logger.log('Initializing WhatsApp channel');
      // TODO: Initialize the WhatsApp client
      // This could use whatsapp-web.js, twilio, or the Meta WhatsApp Business API
      this.logger.log('WhatsApp channel initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize WhatsApp channel:', error);
      throw error;
    }
  }

  async sendMessage(message: OutgoingMessage): Promise<void> {
    try {
      const { userId, content } = message;
      this.logger.log(`Sending message to ${userId}`);

      // TODO: Implement actual message sending
      // Example: await this.client.sendMessage(userId, content);

      // Handle attachments if present
      if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
          // TODO: Send attachment
          // Example: await this.client.sendMedia(userId, attachment.url, attachment.filename);
        }
      }

      this.logger.log(`Message sent to ${userId} successfully`);
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  formatMessage(content: string): string {
    // Apply WhatsApp-specific formatting
    // WhatsApp supports a subset of markdown
    return content;
  }

  async handleIncomingMessage(message: any): Promise<IncomingMessage> {
    try {
      // Convert WhatsApp-specific message format to our standard IncomingMessage
      const standardMessage: IncomingMessage = {
        channelId: this.name.toLowerCase(),
        userId: message.from, // The phone number
        content: message.body,
        timestamp: new Date(),
        metadata: {
          messageId: message.id,
          // Add any other WhatsApp-specific metadata
        },
      };

      return standardMessage;
    } catch (error) {
      this.logger.error('Error handling incoming WhatsApp message:', error);
      throw error;
    }
  }
}
```

## Message Types

### Incoming Message

The IncomingMessage interface defines the structure of messages received from users:

```typescript
export interface IncomingMessage {
  channelId: string;
  userId: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  attachments?: Attachment[];
}
```

### Outgoing Message

The OutgoingMessage interface defines the structure of messages sent to users:

```typescript
export interface OutgoingMessage {
  channelId: string;
  userId: string;
  content: string;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}
```

### Attachment

The Attachment interface defines the structure of file attachments:

```typescript
export interface Attachment {
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  filename?: string;
  caption?: string;
}
```

## Integration with AI Orchestrator

The Communication Channels system integrates with the AI Orchestrator through the Message Formatter Agent:

```typescript
@Injectable()
export class MessageFormatterAgent {
  private readonly llm: ChatOpenAI;

  constructor(private readonly channelService: ChannelService) {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
    });
  }

  createNode(): RunnableLike<typeof AgentState.State, any, any> {
    // ... implementation details ...

    return prompt.pipe(this.llm).pipe(async (result) => {
      // Extract the final message content
      const content = result.content as string;

      // Get the user's phone number from the state
      const userPhone = result.userPhone || '';

      // Determine the channel from the user's phone number
      // For now, we assume WhatsApp is the only channel
      const channelId = 'whatsapp';

      // Format the message for the specific channel
      const formattedContent = this.channelService.formatMessage(
        channelId,
        content,
      );

      // Send the formatted message to the user
      await this.channelService.sendMessage({
        channelId,
        userId: userPhone,
        content: formattedContent,
      });

      return {
        messages: result.messages || [],
      };
    });
  }
}
```

## Future Enhancements

1. **Additional Channels**: Implement channels for other platforms like Slack, Telegram, and SMS.
2. **Rich Media Support**: Enhance attachment handling for images, audio, video, and documents.
3. **Channel-Specific Features**: Implement platform-specific features like WhatsApp templates or Slack interactive components.
4. **User Preferences**: Allow users to set their preferred communication channel.
5. **Fallback Mechanisms**: Implement fallback channels if the primary channel is unavailable.

## Current Implementation

### Message Broker Service

The current implementation uses a basic message broker service that handles message routing:

```typescript
@Injectable()
export class MessageBrokerService {
  private readonly logger = new Logger(MessageBrokerService.name);

  async sendMessage(message: any): Promise<void> {
    this.logger.log(`Sending message: ${JSON.stringify(message)}`);
    // Basic message sending implementation
  }

  async receiveMessage(message: any): Promise<any> {
    this.logger.log(`Received message: ${JSON.stringify(message)}`);
    // Basic message receiving implementation
    return message;
  }
}
```

This simpler approach focuses on the core functionality needed for the current stage of development.

## Planned Enhancements

The full channel abstraction layer described in this documentation represents the target architecture that will be implemented in future iterations. This will include:
