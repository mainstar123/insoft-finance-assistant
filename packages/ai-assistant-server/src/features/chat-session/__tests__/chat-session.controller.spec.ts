import { Test, TestingModule } from '@nestjs/testing';
import { ChatSessionController } from '../chat-session.controller';
import { ChatSessionService } from '../chat-session.service';
import { ChatSessionMapper } from '../mappers/chat-session.mapper';

describe('ChatSessionController', () => {
  let controller: ChatSessionController;
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
      controllers: [ChatSessionController],
      providers: [
        {
          provide: ChatSessionService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockChatSession),
            findAll: jest.fn().mockResolvedValue([mockChatSession]),
            findOne: jest.fn().mockResolvedValue(mockChatSession),
            getMessages: jest.fn().mockResolvedValue(mockChatSession.messages),
            addMessage: jest
              .fn()
              .mockResolvedValue(mockChatSession.messages[0]),
          },
        },
      ],
    }).compile();

    controller = module.get<ChatSessionController>(ChatSessionController);
    service = module.get<ChatSessionService>(ChatSessionService);
  });

  describe('create', () => {
    it('should create a new chat session', async () => {
      const createDto = { userId: 1, status: 'active' };
      const result = await controller.create(createDto);

      expect(result).toEqual(ChatSessionMapper.toResponse(mockChatSession));
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all chat sessions for a user', async () => {
      const result = await controller.findAll(1);

      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('getMessages', () => {
    it('should return messages for a session', async () => {
      const result = await controller.getMessages(1);

      expect(result).toHaveLength(1);
      expect(service.getMessages).toHaveBeenCalledWith(1);
    });
  });

  describe('addMessage', () => {
    it('should add a message to a session', async () => {
      const messageDto = { sender: 'user', message: 'Hello' };
      const result = await controller.addMessage(1, messageDto);

      expect(result.message).toBe('Hello');
      expect(service.addMessage).toHaveBeenCalledWith(1, messageDto);
    });
  });
});
