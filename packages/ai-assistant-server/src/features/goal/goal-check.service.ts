import { Injectable, Logger } from '@nestjs/common';
import { GoalService } from './goal.service';
import { IGoal } from './interfaces/goal.interface';

/**
 * Service for checking goal progress and mapping between goal representations
 */
@Injectable()
export class GoalCheckService {
  private readonly logger = new Logger(GoalCheckService.name);

  constructor(private readonly goalService: GoalService) {}

  /**
   * Check if a transaction contributes to a goal
   * @param userId User ID
   * @param categoryName Category name
   * @param amountCents Transaction amount in cents (absolute value)
   * @returns Goal check result
   */
  async checkGoalContribution(
    userId: number,
    categoryName: string,
    amountCents: number,
  ): Promise<{
    contributesToGoal: boolean;
    goalId?: number;
    goalName?: string;
    currentAmountCents?: number;
    targetAmountCents?: number;
    percentComplete?: number;
    remainingAmountCents?: number;
  }> {
    try {
      // Find all goals for the user
      const goals = await this.goalService.findAll(userId);

      if (goals.length === 0) {
        // No goals found for this user
        return { contributesToGoal: false };
      }

      // Find a goal that matches the category (simplified approach)
      // In a real implementation, you would have a more sophisticated matching logic
      const matchingGoal = goals.find(
        (g) =>
          g.name.toLowerCase().includes(categoryName.toLowerCase()) ||
          (g.description &&
            g.description.toLowerCase().includes(categoryName.toLowerCase())),
      );

      if (!matchingGoal) {
        // No matching goal found
        return { contributesToGoal: false };
      }

      // Calculate goal metrics
      const percentComplete =
        (matchingGoal.currentAmountCents / matchingGoal.targetAmountCents) *
        100;
      const remainingAmountCents =
        matchingGoal.targetAmountCents - matchingGoal.currentAmountCents;

      return {
        contributesToGoal: true,
        goalId: matchingGoal.id,
        goalName: matchingGoal.name,
        currentAmountCents: matchingGoal.currentAmountCents,
        targetAmountCents: matchingGoal.targetAmountCents,
        percentComplete,
        remainingAmountCents,
      };
    } catch (error) {
      this.logger.error(`Error checking goal contribution: ${error}`);
      // Default to not contributing if there's an error
      return { contributesToGoal: false };
    }
  }

  /**
   * Update goal progress after a transaction
   * @param goalId Goal ID
   * @param additionalAmountCents Additional amount in cents
   */
  async updateGoalProgress(
    goalId: number,
    additionalAmountCents: number,
  ): Promise<IGoal> {
    try {
      // Get current goal
      const goal = await this.goalService.findOne(goalId);

      // Calculate new amount
      const newAmountCents = goal.currentAmountCents + additionalAmountCents;

      // Update goal progress
      return await this.goalService.updateProgress(goalId, newAmountCents);
    } catch (error) {
      this.logger.error(`Error updating goal progress: ${error}`);
      throw error;
    }
  }

  /**
   * Map database goals to LangGraph goal format
   * @param goals Database goals
   * @returns LangGraph goals
   */
  mapToLangGraphGoals(goals: IGoal[]): any[] {
    return goals.map((goal) => {
      // Convert null to undefined for dueDate
      const dueDate = goal.dueDate === null ? undefined : goal.dueDate;

      return {
        id: goal.id,
        name: goal.name,
        description: goal.description,
        targetAmountCents: goal.targetAmountCents,
        currentAmountCents: goal.currentAmountCents,
        amountCents: goal.currentAmountCents,
        targetDate: goal.dueDate || new Date(),
        startDate: goal.createdAt,
        dueDate,
        achieved: goal.achieved,
        account: goal.accountId
          ? {
              id: goal.accountId,
              name: 'Account', // Note: You might want to fetch the actual account name if needed
              type: 'checking', // Default type
              balanceCents: 0, // Default balance
              isActive: true, // Default active status
            }
          : null,
      };
    });
  }

  /**
   * Get all goals for a user
   * @param userId User ID
   * @returns Goals with progress information
   */
  async getGoalsWithProgress(userId: number): Promise<{
    goals: any[];
    totalSaved: number;
    totalTarget: number;
    overallProgress: number;
  }> {
    try {
      // Get all goals for the user
      const goals = await this.goalService.findAll(userId);

      if (goals.length === 0) {
        return {
          goals: [],
          totalSaved: 0,
          totalTarget: 0,
          overallProgress: 0,
        };
      }

      // Map to LangGraph format
      const langGraphGoals = this.mapToLangGraphGoals(goals);

      // Calculate overall progress
      const totalSavedCents = goals.reduce(
        (sum, g) => sum + g.currentAmountCents,
        0,
      );
      const totalTargetCents = goals.reduce(
        (sum, g) => sum + g.targetAmountCents,
        0,
      );
      const overallProgress =
        totalTargetCents > 0 ? (totalSavedCents / totalTargetCents) * 100 : 0;

      return {
        goals: langGraphGoals,
        totalSaved: totalSavedCents / 100, // Convert cents to dollars
        totalTarget: totalTargetCents / 100, // Convert cents to dollars
        overallProgress,
      };
    } catch (error) {
      this.logger.error(`Error getting goals with progress: ${error}`);
      return {
        goals: [],
        totalSaved: 0,
        totalTarget: 0,
        overallProgress: 0,
      };
    }
  }
}
