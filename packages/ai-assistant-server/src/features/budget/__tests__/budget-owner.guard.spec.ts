import { ExecutionContext } from '@nestjs/common';
import { BudgetOwnerGuard } from '../guards/budget-owner.guard';
import { BudgetService } from '../budget.service';
import { BudgetNotOwnerException } from '../exceptions/budget.exception';

describe('BudgetOwnerGuard', () => {
  let guard: BudgetOwnerGuard;
  let budgetService: BudgetService;

  const mockBudget = {
    id: 1,
    userId: 1,
    categoryId: null,
    isGeneral: true,
    period: new Date(),
    amountCents: 10000,
    spentCents: 0,
    remainingCents: 10000,
    isArchived: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    budgetService = {
      findOne: jest.fn(),
    } as any;

    guard = new BudgetOwnerGuard(budgetService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for budget owner', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(budgetService, 'findOne').mockResolvedValue({
        ...mockBudget,
        userId: 1,
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(budgetService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw BudgetNotOwnerException for non-owner', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 2 },
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(budgetService, 'findOne').mockResolvedValue({
        ...mockBudget,
        userId: 1,
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        BudgetNotOwnerException,
      );
    });

    it('should return false when user is not authenticated', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return false when budget id is not provided', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: {},
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });
});
