import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from '../transaction.controller';
import { TransactionService } from '../transaction.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { TransactionType } from '@/core/integrations/database/types';
import { CategoryTransactionDto } from '../dto/category-transaction.dto';

describe('TransactionController', () => {
  let controller: TransactionController;
  let service: TransactionService;

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

  const mockTransactionService = {
    create: jest.fn(),
    createTransfer: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByAccount: jest.fn(),
    findByDateRange: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUncategorized: jest.fn(),
    bulkUpdateCategories: jest.fn(),
    getCategoryStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    service = module.get<TransactionService>(TransactionService);
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

      mockTransactionService.create.mockResolvedValue(mockTransaction);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all transactions for a user', async () => {
      const userId = 1;
      mockTransactionService.findAll.mockResolvedValue([mockTransaction]);

      const result = await controller.findAll(userId);

      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith({ userId });
    });
  });

  describe('findByAccount', () => {
    it('should return transactions for an account', async () => {
      const accountId = 1;
      mockTransactionService.findByAccount.mockResolvedValue([mockTransaction]);

      const result = await controller.findByAccount(accountId);

      expect(result).toHaveLength(1);
      expect(service.findByAccount).toHaveBeenCalledWith(accountId);
    });
  });

  describe('findByDateRange', () => {
    it('should return transactions within date range', async () => {
      const userId = 1;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockTransactionService.findByDateRange.mockResolvedValue([
        mockTransaction,
      ]);

      const result = await controller.findByDateRange(
        startDate,
        endDate,
        userId,
      );

      expect(result).toHaveLength(1);
      expect(service.findByDateRange).toHaveBeenCalledWith(
        userId,
        startDate,
        endDate,
      );
    });
  });

  describe('updateCategory', () => {
    it('should update transaction category', async () => {
      const id = 1;
      const categoryDto: CategoryTransactionDto = {
        categoryId: 1,
        subCategoryId: 2,
        description: 'Updated Category',
      };

      mockTransactionService.update.mockResolvedValue(mockTransaction);

      const result = await controller.update(id, categoryDto);

      expect(result).toBeDefined();
      expect(service.update).toHaveBeenCalledWith(id, categoryDto);
    });
  });

  describe('bulkUpdateCategories', () => {
    it('should update categories for multiple transactions', async () => {
      const transactionIds = [1, 2];
      const categoryDto: CategoryTransactionDto = {
        categoryId: 1,
        subCategoryId: 2,
        description: 'Updated Category',
      };

      await controller.bulkUpdateCategories(transactionIds, categoryDto);

      expect(service.bulkUpdateCategories).toHaveBeenCalledWith(
        transactionIds,
        categoryDto,
      );
    });
  });
});
