import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/core/services';
import { ChatSessionService } from '../chat-session.service';
import { ChatSessionNotFoundException } from '../exceptions/chat-session.exception';
import {
  getMockPrismaService,
  mockPrismaClient,
} from '@/test/mocks/prisma.service.mock';

describe('ChatSessionService', () => {
  let service: ChatSessionService;

  const mockChatSession = {
    id: 1,
    userId: 1,
    startedAt: new Date(),
    status: 'active',
    messages: [
      {
        id: 1,
        sessionId: 1,
        sender: 'user',
        message: 'Hello',
        timestamp: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatSessionService,
        {
          provide: PrismaService,
          useFactory: getMockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChatSessionService>(ChatSessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new chat session', async () => {
      const createDto = { userId: 1, status: 'active' };
      mockPrismaClient.chatSession.create.mockResolvedValue(mockChatSession);

      const result = await service.create(createDto);

      expect(result.id).toBe(1);
      expect(mockPrismaClient.chatSession.create).toHaveBeenCalledWith({
        data: createDto,
        include: { messages: true },
      });
    });
  });

  describe('findAll', () => {
    it('should return all chat sessions for a user', async () => {
      mockPrismaClient.chatSession.findMany.mockResolvedValue([
        mockChatSession,
      ]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.chatSession.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { messages: true },
      });
    });

    it('should return empty array when no sessions found', async () => {
      mockPrismaClient.chatSession.findMany.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a single chat session', async () => {
      mockPrismaClient.chatSession.findFirst.mockResolvedValue(mockChatSession);

      const result = await service.findOne(1, 1);

      expect(result.id).toBe(1);
      expect(result.messages).toHaveLength(1);
    });

    it('should throw ChatSessionNotFoundException when session not found', async () => {
      mockPrismaClient.chatSession.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(
        ChatSessionNotFoundException,
      );
    });
  });

  describe('getMessages', () => {
    it('should return messages for a session', async () => {
      mockPrismaClient.chatSession.findUnique.mockResolvedValue(
        mockChatSession,
      );

      const result = await service.getMessages(1);

      expect(result).toHaveLength(1);
      expect(result?.[0]?.message).toBe('Hello');
    });

    it('should throw ChatSessionNotFoundException when session not found', async () => {
      mockPrismaClient.chatSession.findUnique.mockResolvedValue(null);

      await expect(service.getMessages(999)).rejects.toThrow(
        ChatSessionNotFoundException,
      );
    });
  });

  describe('addMessage', () => {
    it('should add a message to a chat session', async () => {
      const newMessage = {
        id: 2,
        sessionId: 1,
        sender: 'user',
        message: 'New message',
        timestamp: new Date(),
      };

      mockPrismaClient.chatMessage.create.mockResolvedValue(newMessage);

      const result = await service.addMessage(1, {
        sender: 'user',
        message: 'New message',
      });

      expect(result.message).toBe('New message');
      expect(mockPrismaClient.chatMessage.create).toHaveBeenCalledWith({
        data: {
          sessionId: 1,
          sender: 'user',
          message: 'New message',
        },
      });
    });
  });
});
