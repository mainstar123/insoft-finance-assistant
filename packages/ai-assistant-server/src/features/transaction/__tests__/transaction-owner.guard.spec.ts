import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { TransactionOwnerGuard } from '../guards/transaction-owner.guard';
import { TransactionService } from '../transaction.service';
import { TransactionType } from '@/core/integrations/database/types';
import { ITransaction } from '../interfaces/transaction.interface';

describe('TransactionOwnerGuard', () => {
  let guard: TransactionOwnerGuard;
  let transactionService: TransactionService;

  const mockTransaction: ITransaction = {
    id: 1,
    userId: 1,
    accountId: 1,
    description: 'Test Transaction',
    amountCents: 1000,
    currency: 'BRL',
    transactionType: TransactionType.CREDIT,
    transactionDate: new Date(),
    isArchived: false,
    isPaid: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    transactionService = {
      findOne: jest.fn(),
    } as any;

    guard = new TransactionOwnerGuard(transactionService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for transaction owner', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      jest
        .spyOn(transactionService, 'findOne')
        .mockResolvedValue(mockTransaction);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(transactionService.findOne).toHaveBeenCalledWith(1);
    });

    it('should return false for non-owner', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 2 },
            params: { id: '1' },
          }),
        }),
      } as ExecutionContext;

      jest
        .spyOn(transactionService, 'findOne')
        .mockResolvedValue(mockTransaction);

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
    });

    it('should return false when transaction id is not provided', async () => {
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
