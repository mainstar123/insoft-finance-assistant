import { Injectable, Logger } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { IBudget } from './interfaces/budget.interface';
import { Budget } from '@prisma/client';

/**
 * Service for checking budget constraints and mapping between budget representations
 */
@Injectable()
export class BudgetCheckService {
  private readonly logger = new Logger(BudgetCheckService.name);

  constructor(private readonly budgetService: BudgetService) {}

  /**
   * Check if a transaction fits within budget constraints
   * @param userId User ID
   * @param categoryId Category ID
   * @param amountCents Transaction amount in cents (absolute value)
   * @param date Transaction date
   * @returns Budget check result
   */
  async checkBudgetConstraints(
    userId: number,
    categoryId: number | null,
    amountCents: number,
    date: Date,
  ): Promise<{
    withinBudget: boolean;
    budgetId?: number;
    categoryName?: string;
    remainingCents?: number;
    limitCents?: number;
    percentUsed?: number;
  }> {
    try {
      // Find applicable budget for the period and category
      const period = new Date(date.getFullYear(), date.getMonth(), 1);
      const budgets = await this.budgetService.findByPeriod(userId, period);

      if (budgets.length === 0) {
        // No budgets found for this period
        return { withinBudget: true };
      }

      // Find the most specific applicable budget
      // Priority: category-specific budget > general budget
      let applicableBudget = budgets.find((b) => b.categoryId === categoryId);
      if (!applicableBudget) {
        applicableBudget = budgets.find((b) => b.isGeneral);
      }

      if (!applicableBudget) {
        // No applicable budget found
        return { withinBudget: true };
      }

      // Check if transaction fits within budget
      const remainingCents = applicableBudget.remainingCents;
      const withinBudget = amountCents <= remainingCents;
      const percentUsed =
        ((applicableBudget.spentCents + amountCents) /
          applicableBudget.amountCents) *
        100;

      return {
        withinBudget,
        budgetId: applicableBudget.id,
        remainingCents,
        limitCents: applicableBudget.amountCents,
        percentUsed,
      };
    } catch (error) {
      this.logger.error(`Error checking budget constraints: ${error}`);
      // Default to within budget if there's an error
      return { withinBudget: true };
    }
  }

  /**
   * Update budget after a transaction
   * @param userId User ID
   * @param categoryId Category ID
   * @param amountCents Transaction amount in cents (absolute value)
   * @param date Transaction date
   */
  async updateBudgetAfterTransaction(
    userId: number,
    categoryId: number | null,
    amountCents: number,
    date: Date,
  ): Promise<void> {
    try {
      // Find applicable budget for the period and category
      const period = new Date(date.getFullYear(), date.getMonth(), 1);
      const budgets = await this.budgetService.findByPeriod(userId, period);

      if (budgets.length === 0) {
        return; // No budgets to update
      }

      // Find the most specific applicable budget
      let applicableBudget = budgets.find((b) => b.categoryId === categoryId);
      if (!applicableBudget) {
        applicableBudget = budgets.find((b) => b.isGeneral);
      }

      if (!applicableBudget) {
        return; // No applicable budget found
      }

      // Update budget spent and remaining amounts
      const newSpentCents = applicableBudget.spentCents + amountCents;
      const newRemainingCents = applicableBudget.amountCents - newSpentCents;

      await this.budgetService.update(applicableBudget.id, userId, {
        spentCents: newSpentCents,
        remainingCents: newRemainingCents,
      });
    } catch (error) {
      this.logger.error(`Error updating budget after transaction: ${error}`);
    }
  }

  /**
   * Map database budgets to LangGraph budget format
   * @param budgets Database budgets
   * @returns LangGraph budget
   */
  mapToLangGraphBudget(budgets: IBudget[]) {
    const limits: Record<string, number> = {};
    const spent: Record<string, number> = {};

    for (const budget of budgets) {
      const key = budget.categoryId
        ? `category_${budget.categoryId}`
        : 'general';
      limits[key] = budget.amountCents / 100; // Convert cents to dollars
      spent[key] = budget.spentCents / 100; // Convert cents to dollars
    }

    return { limits, spent };
  }

  /**
   * Get budget status for a user
   * @param userId User ID
   * @returns Budget status
   */
  async getBudgetStatus(userId: number): Promise<{
    budget: any;
    totalBudget: number;
    totalSpent: number;
    percentUsed: number;
    remainingBudget: number;
    alerts: Array<{
      categoryId: number | null;
      percentUsed: number;
      isOverBudget: boolean;
    }>;
  }> {
    try {
      // Get current period
      const period = new Date();
      period.setDate(1); // First day of current month

      // Get budgets for current period
      const budgets = await this.budgetService.findByPeriod(userId, period);

      if (budgets.length === 0) {
        return {
          budget: { limits: {}, spent: {} },
          totalBudget: 0,
          totalSpent: 0,
          percentUsed: 0,
          remainingBudget: 0,
          alerts: [],
        };
      }

      // Map to LangGraph budget format
      const budget = this.mapToLangGraphBudget(budgets);

      // Calculate overall budget status
      const totalBudget = budgets.reduce((sum, b) => sum + b.amountCents, 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spentCents, 0);
      const percentUsed =
        totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      // Find categories close to or over budget
      const categoryAlerts = budgets
        .filter((b) => b.amountCents > 0 && b.spentCents / b.amountCents > 0.8) // Over 80% used
        .map((b) => ({
          categoryId: b.categoryId,
          percentUsed: (b.spentCents / b.amountCents) * 100,
          isOverBudget: b.spentCents > b.amountCents,
        }));

      const alerts = categoryAlerts.map((alert) => ({
        categoryId: alert.categoryId || null, // Ensure it's never undefined
        percentUsed: alert.percentUsed,
        isOverBudget: alert.isOverBudget,
      }));

      return {
        budget,
        totalBudget: totalBudget / 100, // Convert to dollars
        totalSpent: totalSpent / 100, // Convert to dollars
        percentUsed,
        remainingBudget: (totalBudget - totalSpent) / 100, // Convert to dollars
        alerts,
      };
    } catch (error) {
      this.logger.error(`Error getting budget status: ${error}`);
      return {
        budget: { limits: {}, spent: {} },
        totalBudget: 0,
        totalSpent: 0,
        percentUsed: 0,
        remainingBudget: 0,
        alerts: [],
      };
    }
  }
}
