import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/services';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { IBudget } from './interfaces/budget.interface';
import { BudgetMapper } from './mappers/budget.mapper';
import {
  BudgetNotFoundException,
  BudgetNotOwnerException,
  DuplicateBudgetException,
} from './exceptions/budget.exception';
import { ICategory } from '../category/interfaces/category.interface';

interface BudgetWithCategory extends IBudget {
  category: ICategory;
}

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateBudgetDto): Promise<IBudget> {
    // Check for duplicate budget in the same period
    const existingBudget = await this.prisma.client.budget.findFirst({
      where: {
        userId: createDto.userId,
        period: createDto.period,
        categoryId: createDto.categoryId,
        isGeneral: createDto.isGeneral,
      },
    });

    if (existingBudget) {
      throw new DuplicateBudgetException(
        `Budget for period ${createDto.period}`,
      );
    }

    const budget = await this.prisma.client.budget.create({
      data: createDto,
    });

    return BudgetMapper.toEntity(budget);
  }

  async findAll(userId: number): Promise<IBudget[]> {
    const budgets = await this.prisma.client.budget.findMany({
      where: { userId, isArchived: false },
      orderBy: { period: 'desc' },
      include: {
        category: true,
      },
    });

    return budgets.map(BudgetMapper.toEntity);
  }

  async findOne(id: number): Promise<IBudget> {
    const budget = await this.prisma.client.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      throw new BudgetNotFoundException(id);
    }

    return BudgetMapper.toEntity(budget);
  }

  async update(
    id: number,
    userId: number,
    updateDto: Partial<CreateBudgetDto>,
  ): Promise<IBudget> {
    const budget = await this.findOne(id);

    if (budget.userId !== userId) {
      throw new BudgetNotOwnerException(id);
    }

    const updatedBudget = await this.prisma.client.budget.update({
      where: { id },
      data: updateDto,
    });

    return BudgetMapper.toEntity(updatedBudget);
  }

  async remove(id: number, userId: number): Promise<void> {
    const budget = await this.findOne(id);

    if (budget.userId !== userId) {
      throw new BudgetNotOwnerException(id);
    }

    // Soft delete by setting isArchived to true
    await this.prisma.client.budget.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async findByPeriod(userId: number, period: Date): Promise<IBudget[]> {
    const budgets = await this.prisma.client.budget.findMany({
      where: {
        userId,
        period,
        isArchived: false,
      },
      include: {
        category: true,
      },
    });

    return budgets.map(BudgetMapper.toEntity);
  }

  /**
   * Get budget utilization for a specific user and period
   * @param userId The user ID
   * @param period The budget period (optional)
   * @returns A promise that resolves to an array of budget utilization data
   */
  async getBudgetUtilization(
    userId: number,
    period?: Date,
  ): Promise<
    Array<{
      budget: IBudget;
      spent: number;
      remaining: number;
      utilizationPercentage: number;
    }>
  > {
    // Get budgets for the user and period
    const budgets = period
      ? await this.findByPeriod(userId, period)
      : await this.findAll(userId);

    if (budgets.length === 0) {
      return [];
    }

    // Calculate the start and end dates for the period
    // If no period is provided, use the current month
    const currentDate = period || new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    // Get all transactions for the period
    const transactions = await this.prisma.client.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        isArchived: false,
      },
      select: {
        categoryId: true,
        amountCents: true,
      },
    });

    // Calculate spending by category
    const spendingByCategory: Record<number, number> = {};
    for (const transaction of transactions) {
      if (transaction.categoryId) {
        spendingByCategory[transaction.categoryId] =
          (spendingByCategory[transaction.categoryId] || 0) +
          Math.abs(transaction.amountCents);
      }
    }

    // Calculate utilization for each budget
    return budgets.map((budget) => {
      const spent = budget.categoryId
        ? spendingByCategory[budget.categoryId] || 0
        : Object.values(spendingByCategory).reduce(
            (sum, amount) => sum + amount,
            0,
          );

      const remaining = Math.max(0, budget.amountCents - spent);
      const utilizationPercentage =
        budget.amountCents > 0
          ? Math.min(100, (spent / budget.amountCents) * 100)
          : 0;

      return {
        budget,
        spent,
        remaining,
        utilizationPercentage,
      };
    });
  }

  /**
   * Get the current budget for a user
   * @param userId The user ID
   * @returns A promise that resolves to the current budget data
   */
  async getCurrentBudget(userId: number): Promise<{
    limits: Record<string, number>;
    spent: Record<string, number>;
  }> {
    // Get the current month's budgets
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    const budgets = await this.findByPeriod(userId, startOfMonth);

    if (budgets.length === 0) {
      return { limits: {}, spent: {} };
    }

    // Get budget utilization data
    const utilization = await this.getBudgetUtilization(userId, startOfMonth);

    // Format the data for the chart
    const limits: Record<string, number> = {};
    const spent: Record<string, number> = {};

    for (const item of utilization) {
      // Use optional chaining and nullish coalescing to safely access category name
      const categoryName =
        item.budget.category?.name ||
        `Category ${item.budget.categoryId || 'Unknown'}`;
      limits[categoryName] = item.budget.amountCents / 100; // Convert cents to dollars
      spent[categoryName] = item.spent / 100; // Convert cents to dollars
    }

    return { limits, spent };
  }
}
