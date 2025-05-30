import { Test, TestingModule } from '@nestjs/testing';
import { GoalController } from '../goal.controller';
import { GoalService } from '../goal.service';
import { CreateGoalDto } from '../dto/create-goal.dto';

describe('GoalController', () => {
  let controller: GoalController;
  let service: GoalService;

  const mockGoal = {
    id: 1,
    userId: 1,
    accountId: 1,
    name: 'Emergency Fund',
    description: 'Save for emergencies',
    targetAmountCents: 1000000,
    currentAmountCents: 500000,
    dueDate: new Date('2024-12-31'),
    achieved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGoalService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateProgress: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalController],
      providers: [
        {
          provide: GoalService,
          useValue: mockGoalService,
        },
      ],
    }).compile();

    controller = module.get<GoalController>(GoalController);
    service = module.get<GoalService>(GoalService);
  });

  describe('create', () => {
    it('should create a goal', async () => {
      const createDto: CreateGoalDto = {
        userId: 1,
        name: 'Emergency Fund',
        targetAmountCents: 1000000,
        currentAmountCents: 0,
        achieved: false,
      };

      mockGoalService.create.mockResolvedValue(mockGoal);

      const result = await controller.create(createDto);

      expect(result.name).toBe('Emergency Fund');
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all goals for a user', async () => {
      const goals = [mockGoal, { ...mockGoal, id: 2, name: 'Vacation Fund' }];
      mockGoalService.findAll.mockResolvedValue(goals);

      const result = await controller.findAll(1);

      expect(result).toHaveLength(2);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('updateProgress', () => {
    it('should update goal progress', async () => {
      const updatedGoal = {
        ...mockGoal,
        currentAmountCents: 750000,
      };
      mockGoalService.updateProgress.mockResolvedValue(updatedGoal);

      const result = await controller.updateProgress(1, 750000);

      expect(result.currentAmountCents).toBe(750000);
      expect(service.updateProgress).toHaveBeenCalledWith(1, 750000);
    });
  });

  describe('remove', () => {
    it('should remove a goal', async () => {
      mockGoalService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
