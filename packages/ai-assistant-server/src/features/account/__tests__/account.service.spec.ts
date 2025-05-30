import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/core/services';
import { AccountService } from '../account.service';
import {
  AccountNotFoundException,
  DuplicateAccountException,
} from '../exceptions/account.exception';
import { AccountType } from '@prisma/client';
import {
  getMockPrismaService,
  mockPrismaClient,
} from '@/test/mocks/prisma.service.mock';

describe('AccountService', () => {
  let service: AccountService;

  const mockAccount = {
    id: 1,
    userId: 1,
    name: 'Test Account',
    type: AccountType.CHECKING,
    balanceCents: 1000,
    balanceCurrency: 'USD',
    isDefault: false,
    isArchived: false,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: PrismaService,
          useFactory: getMockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return active accounts', async () => {
      mockPrismaClient.account.findMany.mockResolvedValue([mockAccount]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.account.findMany).toHaveBeenCalledWith({
        where: { userId: 1, isArchived: false },
      });
    });
  });

  describe('setDefault', () => {
    it('should set an account as default', async () => {
      mockPrismaClient.account.findFirst.mockResolvedValue(mockAccount);
      mockPrismaClient.account.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.account.update.mockResolvedValue({
        ...mockAccount,
        isDefault: true,
      });

      const result = await service.setDefault(1, 1);

      expect(result.isDefault).toBe(true);
      expect(mockPrismaClient.account.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, isDefault: true },
        data: { isDefault: false },
      });
      expect(mockPrismaClient.account.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isDefault: true },
      });
    });

    it('should throw AccountNotFoundException when account not found', async () => {
      mockPrismaClient.account.findFirst.mockResolvedValue(null);

      await expect(service.setDefault(999, 1)).rejects.toThrow(
        AccountNotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new account', async () => {
      mockPrismaClient.account.findFirst.mockResolvedValue(null);
      mockPrismaClient.account.create.mockResolvedValue(mockAccount);

      const result = await service.create({
        userId: 1,
        name: 'Test Account',
        type: AccountType.CHECKING,
        balanceCents: 1000,
        balanceCurrency: 'USD',
        isDefault: false,
      });

      expect(result).toEqual(
        expect.objectContaining({
          name: 'Test Account',
          type: 'CHECKING',
        }),
      );
    });

    it('should throw DuplicateAccountException for duplicate names', async () => {
      mockPrismaClient.account.findFirst.mockResolvedValue(mockAccount);

      await expect(
        service.create({
          userId: 1,
          name: 'Test Account',
          type: AccountType.CHECKING,
          balanceCents: 1000,
          balanceCurrency: 'USD',
          isDefault: false,
        }),
      ).rejects.toThrow(DuplicateAccountException);
    });
  });
});
