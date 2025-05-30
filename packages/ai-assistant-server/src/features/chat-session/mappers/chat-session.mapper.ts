import { ChatMessage, ChatSession } from '@prisma/client';
import {
  IChatMessage,
  IChatSession,
} from '../interfaces/chat-session.interface';
import {
  ChatMessageResponseDto,
  ChatSessionResponseDto,
} from '../dto/chat-session-response.dto';

export class ChatSessionMapper {
  static toEntity(
    prismaSession: ChatSession & { messages?: ChatMessage[] },
  ): IChatSession {
    return {
      id: prismaSession.id,
      userId: prismaSession.userId,
      startedAt: prismaSession.startedAt,
      status: prismaSession.status,
      messages: prismaSession.messages?.map(ChatSessionMapper.messageToEntity),
    };
  }

  static messageToEntity(prismaMessage: ChatMessage): IChatMessage {
    return {
      id: prismaMessage.id,
      sessionId: prismaMessage.sessionId,
      sender: prismaMessage.sender,
      message: prismaMessage.message,
      timestamp: prismaMessage.timestamp,
    };
  }

  static toResponse(session: IChatSession): ChatSessionResponseDto {
    return new ChatSessionResponseDto({
      ...session,
      messages: session.messages?.map((msg) => new ChatMessageResponseDto(msg)),
    });
  }
}
