import { Goal } from '@/core/integrations/database/types';
import { IGoal } from '../interfaces/goal.interface';
import { GoalResponseDto } from '../dto/goal-response.dto';

export class GoalMapper {
  static toEntity(prismaGoal: Goal): IGoal {
    return {
      id: prismaGoal.id,
      userId: prismaGoal.userId,
      accountId: prismaGoal.accountId,
      name: prismaGoal.name,
      description: prismaGoal.description || undefined,
      targetAmountCents: prismaGoal.targetAmountCents,
      currentAmountCents: prismaGoal.currentAmountCents,
      dueDate: prismaGoal.dueDate || undefined,
      achieved: prismaGoal.achieved,
      createdAt: prismaGoal.createdAt,
      updatedAt: prismaGoal.updatedAt,
    };
  }

  static toResponse(goal: IGoal): GoalResponseDto {
    return new GoalResponseDto({
      ...goal,
      accountId: goal.accountId || undefined,
      dueDate: goal.dueDate || undefined,
    });
  }
}
