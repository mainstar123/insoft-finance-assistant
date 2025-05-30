import { PrismaService } from '@/core/services';
import { Injectable } from '@nestjs/common';
import { TransactionType } from '@/core/integrations/database/types';
import { CategoryTransactionDto } from './dto/category-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionNotFoundException } from './exceptions/transaction.exception';
import { ITransaction } from './interfaces/transaction.interface';
import { TransactionMapper } from './mappers/transaction.mapper';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateTransactionDto): Promise<ITransaction> {
    const transaction = await this.prisma.client.transaction.create({
      data: {
        userId: createDto.userId,
        accountId: createDto.accountId,
        categoryId: createDto.categoryId,
        subCategoryId: createDto.subCategoryId,
        description: createDto.description,
        amountCents: createDto.amountCents,
        currency: createDto.currency,
        transactionType: createDto.type,
        transactionDate: createDto.date,
        oppositeAccountId: createDto.oppositeAccountId,
        investmentAsset: createDto.investmentAsset,
        investmentType: createDto.investmentType,
        broker: createDto.broker,
        isArchived: createDto.isArchived ?? false,
        isPaid: createDto.isPaid ?? true,
      },
    });
    return TransactionMapper.toEntity(transaction);
  }

  async createTransfer(
    createDto: CreateTransactionDto & { oppositeAccountId: number },
  ): Promise<ITransaction> {
    const [debitTransaction] = await this.prisma.client.$transaction([
      this.prisma.client.transaction.create({
        data: {
          ...createDto,
          amountCents: -Math.abs(createDto.amountCents),
          transactionType: TransactionType.TRANSFER,
          transactionDate: createDto.date,
        },
      }),
      this.prisma.client.transaction.create({
        data: {
          ...createDto,
          accountId: createDto.oppositeAccountId,
          oppositeAccountId: createDto.accountId,
          amountCents: Math.abs(createDto.amountCents),
          transactionType: TransactionType.TRANSFER,
          transactionDate: createDto.date,
        },
      }),
    ]);

    return TransactionMapper.toEntity(debitTransaction);
  }

  async findAll(filter: {
    userId: number;
    startDate?: string;
    endDate?: string;
    categories?: string[];
    accounts?: number[];
    creditCards?: number[];
    includeIncome?: boolean;
  }): Promise<ITransaction[]> {
    const {
      userId,
      startDate,
      endDate,
      categories,
      accounts,
      creditCards,
      includeIncome,
    } = filter;

    const where: any = {
      userId,
      isArchived: false,
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Add category filter if provided
    if (categories && categories.length > 0) {
      // Convert string category names to IDs if needed
      // This assumes categories are passed as IDs in string format
      const categoryIds = categories
        .map((c) => parseInt(c))
        .filter((id) => !isNaN(id));

      if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds };
      }
    }

    // Add account filter if provided
    if (accounts && accounts.length > 0) {
      where.accountId = { in: accounts };
    }

    // Add credit card filter if provided
    if (creditCards && creditCards.length > 0) {
      // This assumes credit cards are stored as accounts with a specific type
      // Adjust this logic based on your actual data model
      where.accountId = { in: creditCards };
    }

    // Filter by transaction type if includeIncome is specified
    if (includeIncome === false) {
      // Assuming CREDIT is used for income transactions
      where.transactionType = { not: TransactionType.CREDIT };
    }

    const transactions = await this.prisma.client.transaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: {
        category: true,
        subCategory: true,
      },
    });

    return transactions.map(TransactionMapper.toEntity);
  }

  async findOne(id: number): Promise<ITransaction> {
    const transaction = await this.prisma.client.transaction.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new TransactionNotFoundException(id);
    }
    return TransactionMapper.toEntity(transaction);
  }

  async findByAccount(accountId: number): Promise<ITransaction[]> {
    const transactions = await this.prisma.client.transaction.findMany({
      where: { accountId, isArchived: false },
      orderBy: { transactionDate: 'desc' },
    });
    return transactions.map(TransactionMapper.toEntity);
  }

  async findByCategory(categoryId: number): Promise<ITransaction[]> {
    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        OR: [{ categoryId }, { subCategoryId: categoryId }],
        isArchived: false,
      },
      orderBy: { transactionDate: 'desc' },
    });
    return transactions.map(TransactionMapper.toEntity);
  }

  async findByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ITransaction[]> {
    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        userId,
        isArchived: false,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { transactionDate: 'desc' },
    });
    return transactions.map(TransactionMapper.toEntity);
  }

  async update(
    id: number,
    updateDto: Partial<CreateTransactionDto>,
  ): Promise<ITransaction> {
    const transaction = await this.prisma.client.transaction.update({
      where: { id },
      data: {
        ...updateDto,
        transactionDate: updateDto.date,
        transactionType: updateDto.type,
      },
    });
    return TransactionMapper.toEntity(transaction);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.client.transaction.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async findUncategorized(userId: number): Promise<ITransaction[]> {
    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        userId,
        isArchived: false,
        categoryId: null,
        subCategoryId: null,
      },
      orderBy: { transactionDate: 'desc' },
    });
    return transactions.map(TransactionMapper.toEntity);
  }

  async bulkUpdateCategories(
    transactionIds: number[],
    categoryDto: CategoryTransactionDto,
  ): Promise<void> {
    await this.prisma.client.transaction.updateMany({
      where: { id: { in: transactionIds } },
      data: {
        categoryId: categoryDto.categoryId,
        subCategoryId: categoryDto.subCategoryId,
        description: categoryDto.description,
      },
    });
  }

  async findByInvoice(invoiceId: number): Promise<ITransaction[]> {
    const transactions = await this.prisma.client.transaction.findMany({
      where: { invoiceId, isArchived: false },
      orderBy: { transactionDate: 'desc' },
    });
    return transactions.map(TransactionMapper.toEntity);
  }

  async findByType(
    userId: number,
    type: TransactionType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ITransaction[]> {
    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        userId,
        transactionType: type,
        isArchived: false,
        ...(startDate && endDate
          ? {
              transactionDate: {
                gte: startDate,
                lte: endDate,
              },
            }
          : {}),
      },
      orderBy: { transactionDate: 'desc' },
    });
    return transactions.map(TransactionMapper.toEntity);
  }

  async updatePaymentStatus(
    id: number,
    isPaid: boolean,
  ): Promise<ITransaction> {
    const transaction = await this.prisma.client.transaction.update({
      where: { id },
      data: { isPaid },
    });
    return TransactionMapper.toEntity(transaction);
  }

  async findInvestments(userId: number): Promise<ITransaction[]> {
    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        userId,
        transactionType: {
          in: [TransactionType.INVESTMENT, TransactionType.DIVIDEND],
        },
        isArchived: false,
      },
      orderBy: { transactionDate: 'desc' },
    });
    return transactions.map(TransactionMapper.toEntity);
  }

  async getAccountBalance(accountId: number): Promise<number> {
    const account = await this.prisma.client.account.findUnique({
      where: { id: accountId },
      select: { balanceCents: true },
    });
    return account?.balanceCents || 0;
  }

  async updateCategory(
    id: number,
    categoryDto: CategoryTransactionDto,
  ): Promise<ITransaction> {
    const transaction = await this.prisma.client.transaction.update({
      where: { id },
      data: {
        categoryId: categoryDto.categoryId,
        subCategoryId: categoryDto.subCategoryId,
        description: categoryDto.description || undefined,
      },
      include: {
        category: true,
        subCategory: true,
      },
    });
    return TransactionMapper.toEntity(transaction);
  }

  async findByCategories(
    userId: number,
    categoryIds: number[],
    options?: {
      startDate?: Date;
      endDate?: Date;
      type?: TransactionType;
    },
  ): Promise<ITransaction[]> {
    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        userId,
        isArchived: false,
        OR: [
          { categoryId: { in: categoryIds } },
          { subCategoryId: { in: categoryIds } },
        ],
        ...(options?.startDate && options?.endDate
          ? {
              transactionDate: {
                gte: options.startDate,
                lte: options.endDate,
              },
            }
          : {}),
        ...(options?.type ? { type: options.type } : {}),
      },
      include: {
        category: true,
        subCategory: true,
      },
      orderBy: { transactionDate: 'desc' },
    });
    return transactions.map(TransactionMapper.toEntity);
  }

  async getCategoryStats(
    userId: number,
    categoryId: number,
    period: { startDate: Date; endDate: Date },
  ): Promise<{
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
  }> {
    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        userId,
        isArchived: false,
        OR: [{ categoryId }, { subCategoryId: categoryId }],
        transactionDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      select: {
        amountCents: true,
      },
    });

    const totalAmount = transactions.reduce((sum, t) => sum + t.amountCents, 0);
    const transactionCount = transactions.length;

    return {
      totalAmount,
      transactionCount,
      averageAmount: transactionCount > 0 ? totalAmount / transactionCount : 0,
    };
  }
}
