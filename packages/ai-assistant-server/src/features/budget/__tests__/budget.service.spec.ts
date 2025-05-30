import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/core/services';
import { BudgetService } from '../budget.service';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import {
  BudgetNotFoundException,
  BudgetNotOwnerException,
  DuplicateBudgetException,
} from '../exceptions/budget.exception';

describe('BudgetService', () => {
  let service: BudgetService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      budget: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    },
  };

  const mockBudget = {
    id: 1,
    userId: 1,
    categoryId: null,
    isGeneral: true,
    period: new Date('2024-01-01'),
    amountCents: 10000,
    spentCents: 0,
    remainingCents: 10000,
    isArchived: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a new budget', async () => {
      const createDto: CreateBudgetDto = {
        userId: 1,
        isGeneral: true,
        period: new Date('2024-01-01'),
        amountCents: 10000,
        spentCents: 0,
        remainingCents: 10000,
        isArchived: false,
      };

      mockPrismaService.client.budget.findFirst.mockResolvedValue(null);
      mockPrismaService.client.budget.create.mockResolvedValue(mockBudget);

      const result = await service.create(createDto);

      expect(result).toEqual(mockBudget);
      expect(mockPrismaService.client.budget.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should throw DuplicateBudgetException for duplicate budget', async () => {
      const createDto: CreateBudgetDto = {
        userId: 1,
        isGeneral: true,
        period: new Date('2024-01-01'),
        amountCents: 10000,
        spentCents: 0,
        remainingCents: 10000,
        isArchived: false,
      };

      mockPrismaService.client.budget.findFirst.mockResolvedValue(mockBudget);

      await expect(service.create(createDto)).rejects.toThrow(
        DuplicateBudgetException,
      );
    });

    it('should create a budget with category', async () => {
      const createDto: CreateBudgetDto = {
        userId: 1,
        categoryId: 1,
        isGeneral: false,
        period: new Date('2024-01-01'),
        amountCents: 10000,
        spentCents: 0,
        remainingCents: 10000,
        isArchived: false,
      };

      mockPrismaService.client.budget.findFirst.mockResolvedValue(null);
      mockPrismaService.client.budget.create.mockResolvedValue({
        ...mockBudget,
        categoryId: 1,
        isGeneral: false,
      });

      const result = await service.create(createDto);

      expect(result.categoryId).toBe(1);
      expect(result.isGeneral).toBe(false);
    });

    it('should validate remaining cents calculation', async () => {
      const createDto: CreateBudgetDto = {
        userId: 1,
        isGeneral: true,
        period: new Date('2024-01-01'),
        amountCents: 10000,
        spentCents: 3000,
        remainingCents: 7000, // Correct calculation
        isArchived: false,
      };

      mockPrismaService.client.budget.findFirst.mockResolvedValue(null);
      mockPrismaService.client.budget.create.mockResolvedValue({
        ...mockBudget,
        spentCents: 3000,
        remainingCents: 7000,
      });

      const result = await service.create(createDto);

      expect(result.amountCents).toBe(10000);
      expect(result.spentCents).toBe(3000);
      expect(result.remainingCents).toBe(7000);
    });
  });

  describe('findAll', () => {
    it('should return all budgets for user', async () => {
      const budgets = [mockBudget, { ...mockBudget, id: 2 }];
      mockPrismaService.client.budget.findMany.mockResolvedValue(budgets);

      const result = await service.findAll(1);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.client.budget.findMany).toHaveBeenCalledWith({
        where: { userId: 1, isArchived: false },
        orderBy: { period: 'desc' },
        include: {
          category: true,
        },
      });
    });

    it('should return only active budgets', async () => {
      const activeBudget = { ...mockBudget, isArchived: false };
      const archivedBudget = { ...mockBudget, id: 2, isArchived: true };

      mockPrismaService.client.budget.findMany.mockResolvedValue([
        activeBudget,
      ]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockPrismaService.client.budget.findMany).toHaveBeenCalledWith({
        where: { userId: 1, isArchived: false },
        orderBy: { period: 'desc' },
        include: {
          category: true,
        },
      });
    });

    it('should order budgets by period descending', async () => {
      const oldBudget = { ...mockBudget, period: new Date('2023-12-01') };
      const newBudget = {
        ...mockBudget,
        id: 2,
        period: new Date('2024-01-01'),
      };

      mockPrismaService.client.budget.findMany.mockResolvedValue([
        newBudget,
        oldBudget,
      ]);

      const result = await service.findAll(1);

      expect(result[0]?.period).toEqual(newBudget.period);
      expect(result[1]?.period).toEqual(oldBudget.period);
    });
  });

  describe('findOne', () => {
    it('should return a budget by id', async () => {
      mockPrismaService.client.budget.findUnique.mockResolvedValue(mockBudget);

      const result = await service.findOne(1);

      expect(result).toEqual(mockBudget);
    });

    it('should throw BudgetNotFoundException when budget not found', async () => {
      mockPrismaService.client.budget.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(BudgetNotFoundException);
    });
  });

  describe('update', () => {
    it('should update a budget', async () => {
      const updateDto = { amountCents: 20000 };
      const updatedBudget = { ...mockBudget, ...updateDto };

      mockPrismaService.client.budget.findUnique.mockResolvedValue(mockBudget);
      mockPrismaService.client.budget.update.mockResolvedValue(updatedBudget);

      const result = await service.update(1, 1, updateDto);

      expect(result.amountCents).toBe(20000);
    });

    it('should throw BudgetNotOwnerException when user is not owner', async () => {
      mockPrismaService.client.budget.findUnique.mockResolvedValue(mockBudget);

      await expect(service.update(1, 2, {})).rejects.toThrow(
        BudgetNotOwnerException,
      );
    });

    it('should update spent and remaining cents', async () => {
      const originalBudget = {
        ...mockBudget,
        amountCents: 10000,
        spentCents: 3000,
        remainingCents: 7000,
      };

      const updateDto = {
        spentCents: 5000,
        remainingCents: 5000,
      };

      mockPrismaService.client.budget.findUnique.mockResolvedValue(
        originalBudget,
      );
      mockPrismaService.client.budget.update.mockResolvedValue({
        ...originalBudget,
        ...updateDto,
      });

      const result = await service.update(1, 1, updateDto);

      expect(result.spentCents).toBe(5000);
      expect(result.remainingCents).toBe(5000);
    });

    it('should update category', async () => {
      const originalBudget = {
        ...mockBudget,
        categoryId: 1,
      };

      const updateDto = {
        categoryId: 2,
      };

      mockPrismaService.client.budget.findUnique.mockResolvedValue(
        originalBudget,
      );
      mockPrismaService.client.budget.update.mockResolvedValue({
        ...originalBudget,
        ...updateDto,
      });

      const result = await service.update(1, 1, updateDto);

      expect(result.categoryId).toBe(2);
    });
  });

  describe('findByPeriod', () => {
    it('should return budgets for specific period', async () => {
      const period = new Date('2024-01-01');
      const budgets = [mockBudget];
      mockPrismaService.client.budget.findMany.mockResolvedValue(budgets);

      const result = await service.findByPeriod(1, period);

      expect(mockPrismaService.client.budget.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          period,
          isArchived: false,
        },
        include: {
          category: true,
        },
      });
    });

    it('should return both general and category budgets', async () => {
      const generalBudget = { ...mockBudget, isGeneral: true };
      const categoryBudget = {
        ...mockBudget,
        id: 2,
        isGeneral: false,
        categoryId: 1,
      };

      mockPrismaService.client.budget.findMany.mockResolvedValue([
        generalBudget,
        categoryBudget,
      ]);

      const result = await service.findByPeriod(1, new Date('2024-01-01'));

      expect(result).toHaveLength(2);
      expect(result.some((b) => b.isGeneral)).toBe(true);
      expect(result.some((b) => b.categoryId === 1)).toBe(true);
    });

    it('should handle empty period results', async () => {
      mockPrismaService.client.budget.findMany.mockResolvedValue([]);

      const result = await service.findByPeriod(1, new Date('2024-01-01'));

      expect(result).toHaveLength(0);
    });
  });

  describe('remove', () => {
    it('should archive instead of delete', async () => {
      const budget = { ...mockBudget, isArchived: false };

      mockPrismaService.client.budget.findUnique.mockResolvedValue(budget);
      mockPrismaService.client.budget.update.mockResolvedValue({
        ...budget,
        isArchived: true,
      });

      await service.remove(1, 1);

      expect(mockPrismaService.client.budget.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isArchived: true },
      });
    });
  });
});
