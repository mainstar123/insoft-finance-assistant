import { ExecutionContext } from '@nestjs/common';
import { GoalOwnerGuard } from '../guards/goal-owner.guard';
import { GoalService } from '../goal.service';
import { GoalNotFoundException } from '../exceptions/goal.exception';

describe('GoalOwnerGuard', () => {
  let guard: GoalOwnerGuard;
  let goalService: GoalService;

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

  beforeEach(() => {
    goalService = {
      findOne: jest.fn(),
    } as any;

    guard = new GoalOwnerGuard(goalService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when user owns the goal', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(goalService, 'findOne').mockResolvedValue(mockGoal);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(goalService.findOne).toHaveBeenCalledWith(1);
    });

    it('should return false when user does not own the goal', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 2 }, // Different user ID
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(goalService, 'findOne').mockResolvedValue(mockGoal);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return false when goal is not found', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: '999' },
          }),
        }),
      } as ExecutionContext;

      jest
        .spyOn(goalService, 'findOne')
        .mockRejectedValue(new GoalNotFoundException(999));

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
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
      expect(goalService.findOne).not.toHaveBeenCalled();
    });

    it('should return false when goal id is not provided', async () => {
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
      expect(goalService.findOne).not.toHaveBeenCalled();
    });

    it('should handle non-numeric goal IDs', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: 'invalid' },
          }),
        }),
      } as ExecutionContext;

      jest
        .spyOn(goalService, 'findOne')
        .mockRejectedValue(new Error('Invalid ID'));

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });
});
