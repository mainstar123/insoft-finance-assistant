import { ChatSessionMapper } from '../mappers/chat-session.mapper';
import { ChatMessage, ChatSession } from '@prisma/client';

describe('ChatSessionMapper', () => {
  const mockDate = new Date();

  const mockChatMessage: ChatMessage = {
    id: 1,
    sessionId: 1,
    sender: 'user',
    message: 'Hello',
    timestamp: mockDate,
  };

  const mockChatSession: ChatSession & { messages?: ChatMessage[] } = {
    id: 1,
    userId: 1,
    startedAt: mockDate,
    status: 'active',
    messages: [mockChatMessage],
  };

  describe('toEntity', () => {
    it('should map PrismaSession to IChatSession', () => {
      const result = ChatSessionMapper.toEntity(mockChatSession);

      expect(result).toEqual({
        id: 1,
        userId: 1,
        startedAt: mockDate,
        status: 'active',
        messages: [
          {
            id: 1,
            sessionId: 1,
            sender: 'user',
            message: 'Hello',
            timestamp: mockDate,
          },
        ],
      });
    });

    it('should handle session without messages', () => {
      const sessionWithoutMessages = {
        ...mockChatSession,
        messages: undefined,
      };
      const result = ChatSessionMapper.toEntity(sessionWithoutMessages);

      expect(result.messages).toBeUndefined();
    });
  });

  describe('messageToEntity', () => {
    it('should map PrismaMessage to IChatMessage', () => {
      const result = ChatSessionMapper.messageToEntity(mockChatMessage);

      expect(result).toEqual({
        id: 1,
        sessionId: 1,
        sender: 'user',
        message: 'Hello',
        timestamp: mockDate,
      });
    });
  });

  describe('toResponse', () => {
    it('should map IChatSession to ChatSessionResponseDto', () => {
      const entity = ChatSessionMapper.toEntity(mockChatSession);
      const result = ChatSessionMapper.toResponse(entity);

      expect(result).toEqual({
        id: 1,
        userId: 1,
        startedAt: mockDate,
        status: 'active',
        messages: [
          {
            id: 1,
            sessionId: 1,
            sender: 'user',
            message: 'Hello',
            timestamp: mockDate,
          },
        ],
      });
    });
  });
});
