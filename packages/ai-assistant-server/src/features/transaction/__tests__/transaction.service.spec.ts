import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/core/services';
import { TransactionService } from '../transaction.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { TransactionType } from '@/core/integrations/database/types';
import { TransactionNotFoundException } from '../exceptions/transaction.exception';
import { CategoryTransactionDto } from '../dto/category-transaction.dto';

describe('TransactionService', () => {
  let service: TransactionService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      transaction: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    },
  };

  const mockTransaction = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const createDto: CreateTransactionDto = {
        userId: 1,
        accountId: 1,
        description: 'Test Transaction',
        amountCents: 1000,
        currency: 'BRL',
        type: TransactionType.CREDIT,
        date: new Date(),
      };

      mockPrismaService.client.transaction.create.mockResolvedValue(
        mockTransaction,
      );

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockTransaction.id);
      expect(mockPrismaService.client.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: createDto.userId,
          accountId: createDto.accountId,
          description: createDto.description,
        }),
      });
    });

    it('should create a transaction with optional fields', async () => {
      const createDto: CreateTransactionDto = {
        userId: 1,
        accountId: 1,
        description: 'Test Transaction',
        amountCents: 1000,
        currency: 'BRL',
        type: TransactionType.CREDIT,
        date: new Date(),
        categoryId: 1,
        subCategoryId: 2,
        notes: 'Test notes',
      };

      const mockTransactionWithOptionals = {
        ...mockTransaction,
        categoryId: 1,
        subCategoryId: 2,
        notes: 'Test notes',
      };

      mockPrismaService.client.transaction.create.mockResolvedValue(
        mockTransactionWithOptionals,
      );

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.categoryId).toBe(createDto.categoryId);
      expect(result.subCategoryId).toBe(createDto.subCategoryId);
    });
  });

  describe('findAll', () => {
    it('should return all non-archived transactions for a user', async () => {
      const userId = 1;
      const transactions = [mockTransaction, { ...mockTransaction, id: 2 }];

      mockPrismaService.client.transaction.findMany.mockResolvedValue(
        transactions,
      );

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
      expect(
        mockPrismaService.client.transaction.findMany,
      ).toHaveBeenCalledWith({
        where: { userId, isArchived: false },
        orderBy: { transactionDate: 'desc' },
      });
    });

    it('should return empty array when no transactions found', async () => {
      mockPrismaService.client.transaction.findMany.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('findByAccount', () => {
    it('should return all transactions for an account', async () => {
      const accountId = 1;
      mockPrismaService.client.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);

      const result = await service.findByAccount(accountId);

      expect(result).toHaveLength(1);
      expect(
        mockPrismaService.client.transaction.findMany,
      ).toHaveBeenCalledWith({
        where: { accountId, isArchived: false },
        orderBy: { transactionDate: 'desc' },
      });
    });
  });

  describe('findByDateRange', () => {
    it('should return transactions within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockPrismaService.client.transaction.findMany.mockResolvedValue([
        mockTransaction,
      ]);

      const result = await service.findByDateRange(1, startDate, endDate);

      expect(result).toHaveLength(1);
      expect(
        mockPrismaService.client.transaction.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: 1,
          isArchived: false,
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { transactionDate: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const updateDto = {
        description: 'Updated Transaction',
        amountCents: 2000,
      };

      mockPrismaService.client.transaction.update.mockResolvedValue({
        ...mockTransaction,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result).toBeDefined();
      expect(result.description).toBe(updateDto.description);
      expect(result.amountCents).toBe(updateDto.amountCents);
    });

    it('should throw NotFoundException when updating non-existent transaction', async () => {
      mockPrismaService.client.transaction.update.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(
        service.update(999, { description: 'Test' }),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should archive a transaction', async () => {
      mockPrismaService.client.transaction.findUnique.mockResolvedValue(
        mockTransaction,
      );
      mockPrismaService.client.transaction.update.mockResolvedValue({
        ...mockTransaction,
        isArchived: true,
      });

      await service.remove(1);

      expect(mockPrismaService.client.transaction.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isArchived: true },
      });
    });

    it('should throw NotFoundException when archiving non-existent transaction', async () => {
      mockPrismaService.client.transaction.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        TransactionNotFoundException,
      );
    });
  });

  describe('createTransfer', () => {
    it('should create a transfer between accounts', async () => {
      const createDto = {
        userId: 1,
        accountId: 1,
        oppositeAccountId: 2,
        description: 'Transfer',
        amountCents: 1000,
        currency: 'BRL',
        type: TransactionType.TRANSFER,
        date: new Date(),
      };

      const debitTransaction = {
        ...mockTransaction,
        amountCents: -1000,
        transactionType: TransactionType.TRANSFER,
      };

      // Mock the transaction.create method since it's called within $transaction
      mockPrismaService.client.transaction.create
        .mockResolvedValueOnce(debitTransaction) // First call for debit
        .mockResolvedValueOnce({
          // Second call for credit
          ...mockTransaction,
          id: 2,
          accountId: createDto.oppositeAccountId,
          amountCents: 1000,
          transactionType: TransactionType.TRANSFER,
        });

      // Mock the $transaction to execute the callback
      mockPrismaService.client.$transaction.mockImplementation(
        async (callback) => {
          if (Array.isArray(callback)) {
            // Execute each operation in the transaction array
            const results = await Promise.all(callback);
            return results;
          }
          return [debitTransaction];
        },
      );

      const result = await service.createTransfer(createDto);

      expect(result).toBeDefined();
      expect(result.transactionType).toBe(TransactionType.TRANSFER);
      expect(result.amountCents).toBe(-1000);

      // Verify the transaction creation calls
      expect(mockPrismaService.client.transaction.create).toHaveBeenCalledTimes(
        2,
      );

      // Verify first call (debit transaction)
      expect(mockPrismaService.client.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: createDto.userId,
          accountId: createDto.accountId,
          amountCents: -1000,
          transactionType: TransactionType.TRANSFER,
        }),
      });

      // Verify second call (credit transaction)
      expect(mockPrismaService.client.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: createDto.userId,
          accountId: createDto.oppositeAccountId,
          amountCents: 1000,
          transactionType: TransactionType.TRANSFER,
        }),
      });
    });

    it('should handle transfer creation failure', async () => {
      const createDto = {
        userId: 1,
        accountId: 1,
        oppositeAccountId: 2,
        description: 'Transfer',
        amountCents: 1000,
        currency: 'BRL',
        type: TransactionType.TRANSFER,
        date: new Date(),
      };

      mockPrismaService.client.$transaction.mockRejectedValue(
        new Error('Transfer failed'),
      );

      await expect(service.createTransfer(createDto)).rejects.toThrow(
        'Transfer failed',
      );
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      mockPrismaService.client.transaction.findUnique.mockResolvedValue(
        mockTransaction,
      );

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockTransaction.id);
    });

    it('should throw TransactionNotFoundException when transaction not found', async () => {
      mockPrismaService.client.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        TransactionNotFoundException,
      );
    });
  });

  describe('findUncategorized', () => {
    it('should return uncategorized transactions', async () => {
      const uncategorizedTransaction = {
        ...mockTransaction,
        categoryId: null,
        subCategoryId: null,
      };

      mockPrismaService.client.transaction.findMany.mockResolvedValue([
        uncategorizedTransaction,
      ]);

      const result = await service.findUncategorized(1);

      expect(result).toHaveLength(1);
      expect(
        mockPrismaService.client.transaction.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: 1,
          isArchived: false,
          categoryId: null,
          subCategoryId: null,
        },
        orderBy: { transactionDate: 'desc' },
      });
    });
  });

  describe('bulkUpdateCategories', () => {
    it('should update categories for multiple transactions', async () => {
      const categoryDto: CategoryTransactionDto = {
        categoryId: 1,
        subCategoryId: 2,
        description: 'Updated Category',
      };

      await service.bulkUpdateCategories([1, 2], categoryDto);

      expect(
        mockPrismaService.client.transaction.updateMany,
      ).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: {
          categoryId: categoryDto.categoryId,
          subCategoryId: categoryDto.subCategoryId,
          description: categoryDto.description,
        },
      });
    });
  });
});
