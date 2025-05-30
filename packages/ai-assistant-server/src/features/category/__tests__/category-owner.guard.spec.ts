import { ExecutionContext } from '@nestjs/common';
import { CategoryOwnerGuard } from '../guards/category-owner.guard';
import { CategoryService } from '../category.service';
import { CategoryNotOwnerException } from '../exceptions/category.exception';

describe('CategoryOwnerGuard', () => {
  let guard: CategoryOwnerGuard;
  let categoryService: CategoryService;

  const mockCategory = {
    id: 1,
    userId: 1,
    name: 'Test Category',
    description: 'Test Description',
    color: '#000000',
    createdAt: new Date(),
  };

  beforeEach(() => {
    categoryService = {
      findOne: jest.fn(),
    } as any;

    guard = new CategoryOwnerGuard(categoryService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for category owner', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(categoryService, 'findOne').mockResolvedValue({
        ...mockCategory,
        userId: 1,
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(categoryService.findOne).toHaveBeenCalledWith(1);
    });

    it('should return true for global category', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(categoryService, 'findOne').mockResolvedValue({
        ...mockCategory,
        userId: undefined,
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(categoryService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw CategoryNotOwnerException for non-owner', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 2 },
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(categoryService, 'findOne').mockResolvedValue({
        ...mockCategory,
        userId: 1,
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        CategoryNotOwnerException,
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

    it('should return false when category id is not provided', async () => {
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
