import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatSessionService } from '../chat-session.service';
import { ChatSessionOwnerGuard } from '../guards/chat-session-owner.guard';

describe('ChatSessionOwnerGuard', () => {
  let guard: ChatSessionOwnerGuard;
  let service: ChatSessionService;

  const mockChatSession = {
    id: 1,
    userId: 1,
    startedAt: new Date(),
    status: 'active',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatSessionOwnerGuard,
        {
          provide: ChatSessionService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockChatSession),
          },
        },
      ],
    }).compile();

    guard = module.get<ChatSessionOwnerGuard>(ChatSessionOwnerGuard);
    service = module.get<ChatSessionService>(ChatSessionService);
  });

  describe('canActivate', () => {
    it('should return true when user owns the chat session', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(service.findOne).toHaveBeenCalledWith(1, 1);
    });

    it('should return false when user is not authenticated', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when session id is not provided', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: {},
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
