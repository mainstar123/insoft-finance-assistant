import { Test, TestingModule } from '@nestjs/testing';
import { UserFeedbackController } from '../user-feedback.controller';
import { UserFeedbackService } from '../user-feedback.service';
import { CreateUserFeedbackDto } from '../dto/create-user-feedback.dto';

describe('UserFeedbackController', () => {
  let controller: UserFeedbackController;
  let service: UserFeedbackService;

  const mockFeedback = {
    id: 1,
    userId: 1,
    answers: { question1: 'answer1' },
    openComments: 'Test comment',
    submittedAt: new Date(),
  };

  const mockUserFeedbackService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserFeedbackController],
      providers: [
        {
          provide: UserFeedbackService,
          useValue: mockUserFeedbackService,
        },
      ],
    }).compile();

    controller = module.get<UserFeedbackController>(UserFeedbackController);
    service = module.get<UserFeedbackService>(UserFeedbackService);
  });

  describe('create', () => {
    it('should create a user feedback', async () => {
      const dto: CreateUserFeedbackDto = {
        userId: 1,
        answers: { question1: 'answer1' },
        openComments: 'Test comment',
      };

      mockUserFeedbackService.create.mockResolvedValue(mockFeedback);

      const result = await controller.create(dto);

      expect(result).toBeDefined();
      expect(result.userId).toBe(dto.userId);
      expect(result.answers).toEqual(dto.answers);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all feedbacks for a user', async () => {
      mockUserFeedbackService.findAll.mockResolvedValue([mockFeedback]);

      const result = await controller.findAll(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a specific feedback', async () => {
      mockUserFeedbackService.findOne.mockResolvedValue(mockFeedback);

      const result = await controller.findOne(1, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(service.findOne).toHaveBeenCalledWith(1, 1);
    });
  });
});
