import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/core/services';
import { UserFeedbackService } from '../user-feedback.service';
import { UserFeedbackNotFoundException } from '../exceptions/user-feedback.exception';

describe('UserFeedbackService', () => {
  let service: UserFeedbackService;

  const mockFeedback = {
    id: 1,
    userId: 1,
    answers: { question1: 'answer1' },
    openComments: 'Test comment',
    submittedAt: new Date(),
  };

  const mockPrismaService = {
    client: {
      userFeedback: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserFeedbackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserFeedbackService>(UserFeedbackService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user feedback', async () => {
      mockPrismaService.client.userFeedback.create.mockResolvedValue(mockFeedback);

      const result = await service.create({
        userId: 1,
        answers: { question1: 'answer1' },
        openComments: 'Test comment',
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe(1);
      expect(result.answers).toEqual({ question1: 'answer1' });
    });
  });

  describe('findAll', () => {
    it('should return all feedbacks for a user', async () => {
      mockPrismaService.client.userFeedback.findMany.mockResolvedValue([mockFeedback]);

      const result = await service.findAll(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]?.userId).toBe(1);
    });

    it('should return empty array when no feedbacks found', async () => {
      mockPrismaService.client.userFeedback.findMany.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single feedback', async () => {
      mockPrismaService.client.userFeedback.findFirst.mockResolvedValue(mockFeedback);

      const result = await service.findOne(1, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw if feedback not found', async () => {
      mockPrismaService.client.userFeedback.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(UserFeedbackNotFoundException);
    });
  });
});
