import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/core/services';
import { GoalService } from '../goal.service';
import { CreateGoalDto } from '../dto/create-goal.dto';
import {
  GoalNotFoundException,
  GoalNotOwnerException,
  InvalidGoalProgressException,
} from '../exceptions/goal.exception';

describe('GoalService', () => {
  let service: GoalService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      goal: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GoalService>(GoalService);
    prismaService = module.get<PrismaService>(PrismaService);
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

      mockPrismaService.client.goal.create.mockResolvedValue(mockGoal);

      const result = await service.create(createDto);

      expect(result.name).toBe('Emergency Fund');
      expect(result.targetAmountCents).toBe(1000000);
    });

    it('should create a goal with optional fields', async () => {
      const createDto: CreateGoalDto = {
        userId: 1,
        accountId: 1,
        name: 'House Down Payment',
        description: 'Save for house',
        targetAmountCents: 5000000,
        currentAmountCents: 1000000,
        dueDate: new Date('2025-12-31'),
        achieved: false,
      };

      const mockGoalWithOptionals = { ...mockGoal, ...createDto };
      mockPrismaService.client.goal.create.mockResolvedValue(
        mockGoalWithOptionals,
      );

      const result = await service.create(createDto);

      expect(result.accountId).toBe(1);
      expect(result.description).toBe('Save for house');
      expect(result.dueDate).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all goals for a user', async () => {
      const goals = [mockGoal, { ...mockGoal, id: 2, name: 'Vacation Fund' }];
      mockPrismaService.client.goal.findMany.mockResolvedValue(goals);

      const result = await service.findAll(1);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.client.goal.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateProgress', () => {
    it('should update goal progress and mark as achieved', async () => {
      mockPrismaService.client.goal.findUnique.mockResolvedValue(mockGoal);
      mockPrismaService.client.goal.update.mockResolvedValue({
        ...mockGoal,
        currentAmountCents: 1000000,
        achieved: true,
      });

      const result = await service.updateProgress(1, 1000000);

      expect(result.currentAmountCents).toBe(1000000);
      expect(result.achieved).toBe(true);
    });

    it('should throw error for negative progress', async () => {
      mockPrismaService.client.goal.findUnique.mockResolvedValue(mockGoal);

      await expect(service.updateProgress(1, -1000)).rejects.toThrow(
        InvalidGoalProgressException,
      );
    });

    it('should throw error for progress exceeding target', async () => {
      mockPrismaService.client.goal.findUnique.mockResolvedValue(mockGoal);

      await expect(service.updateProgress(1, 2000000)).rejects.toThrow(
        InvalidGoalProgressException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a goal', async () => {
      const unachievedGoal = { ...mockGoal, achieved: false };
      mockPrismaService.client.goal.findUnique.mockResolvedValue(
        unachievedGoal,
      );
      mockPrismaService.client.goal.delete.mockResolvedValue(unachievedGoal);

      await service.remove(1);

      expect(mockPrismaService.client.goal.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should not allow deleting achieved goals', async () => {
      const achievedGoal = { ...mockGoal, achieved: true };
      mockPrismaService.client.goal.findUnique.mockResolvedValue(achievedGoal);

      await expect(service.remove(1)).rejects.toThrow(
        InvalidGoalProgressException,
      );
    });
  });
});
