import { Budget } from '@/core/integrations/database/types';
import { IBudget } from '../interfaces/budget.interface';
import { BudgetResponseDto } from '../dto/budget-response.dto';

export class BudgetMapper {
  static toEntity(prismaBudget: Budget): IBudget {
    return {
      id: prismaBudget.id,
      userId: prismaBudget.userId,
      categoryId: prismaBudget.categoryId,
      isGeneral: prismaBudget.isGeneral,
      period: prismaBudget.period,
      amountCents: prismaBudget.amountCents,
      spentCents: prismaBudget.spentCents,
      remainingCents: prismaBudget.remainingCents,
      isArchived: prismaBudget.isArchived,
      createdAt: prismaBudget.createdAt,
    };
  }

  static toResponse(budget: IBudget): BudgetResponseDto {
    return new BudgetResponseDto({
      ...budget,
      categoryId: budget.categoryId || undefined,
    });
  }
}
