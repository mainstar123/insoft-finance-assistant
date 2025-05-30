import { Test, TestingModule } from '@nestjs/testing';
import { BudgetController } from '../budget.controller';
import { BudgetService } from '../budget.service';
import { CreateBudgetDto } from '../dto/create-budget.dto';

describe('BudgetController', () => {
  let controller: BudgetController;
  let service: BudgetService;

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

  const mockBudgetService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByPeriod: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        {
          provide: BudgetService,
          useValue: mockBudgetService,
        },
      ],
    }).compile();

    controller = module.get<BudgetController>(BudgetController);
    service = module.get<BudgetService>(BudgetService);
  });

  describe('create', () => {
    it('should create a budget', async () => {
      const createDto: CreateBudgetDto = {
        userId: 1,
        isGeneral: true,
        period: new Date('2024-01-01'),
        amountCents: 10000,
        spentCents: 0,
        remainingCents: 10000,
        isArchived: false,
      };

      mockBudgetService.create.mockResolvedValue(mockBudget);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all budgets for user', async () => {
      const req = { user: { id: 1 } };
      mockBudgetService.findAll.mockResolvedValue([mockBudget]);

      const result = await controller.findAll(req);

      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a budget by id', async () => {
      mockBudgetService.findOne.mockResolvedValue(mockBudget);

      const result = await controller.findOne(1);

      expect(result).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a budget', async () => {
      const updateDto = { amountCents: 20000 };
      const req = { user: { id: 1 } };
      const updatedBudget = { ...mockBudget, ...updateDto };

      mockBudgetService.update.mockResolvedValue(updatedBudget);

      const result = await controller.update(1, updateDto, req);

      expect(result.amountCents).toBe(20000);
      expect(service.update).toHaveBeenCalledWith(1, 1, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a budget', async () => {
      const req = { user: { id: 1 } };
      mockBudgetService.remove.mockResolvedValue(undefined);

      await controller.remove(1, req);

      expect(service.remove).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('findByPeriod', () => {
    it('should return budgets for specific period', async () => {
      const req = { user: { id: 1 } };
      const date = '2024-01-01';
      mockBudgetService.findByPeriod.mockResolvedValue([mockBudget]);

      const result = await controller.findByPeriod(date, req);

      expect(result).toHaveLength(1);
      expect(service.findByPeriod).toHaveBeenCalledWith(1, new Date(date));
    });
  });
}); 
