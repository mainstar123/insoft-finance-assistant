import {
  AccountType
} from '@/test/mocks/prisma.service.mock';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@prisma/client';
import { AccountService } from '../account.service';
import { AccountOwnerGuard } from '../guards/account-owner.guard';

describe('AccountOwnerGuard', () => {
  let guard: AccountOwnerGuard;
  let service: AccountService;

  const mockAccount: Account = {
    id: 1,
    userId: 1,
    name: 'Test Account',
    description: null,
    balanceCents: 1000,
    balanceCurrency: 'BRL',
    type: AccountType.CHECKING,
    isDefault: false,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccountService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountOwnerGuard,
        {
          provide: AccountService,
          useValue: mockAccountService,
        },
      ],
    }).compile();

    guard = module.get<AccountOwnerGuard>(AccountOwnerGuard);
    service = module.get<AccountService>(AccountService);
  });

  describe('canActivate', () => {
    it('should allow access when user owns the account', async () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: 1 },
          }),
        }),
      } as ExecutionContext;

      mockAccountService.findOne.mockResolvedValue(mockAccount);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(service.findOne).toHaveBeenCalledWith(1, 1);
    });

    it('should deny access when user does not own the account', async () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 2 },
            params: { id: 1 },
          }),
        }),
      } as ExecutionContext;

      mockAccountService.findOne.mockResolvedValue(mockAccount);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should deny access when user is not authenticated', async () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: 1 },
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });
  });
});
