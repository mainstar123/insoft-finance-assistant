import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { BudgetService } from '../budget.service';
import { BudgetNotOwnerException } from '../exceptions/budget.exception';

@Injectable()
export class BudgetOwnerGuard implements CanActivate {
  constructor(private readonly budgetService: BudgetService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const budgetId = parseInt(request.params.id);

    // Check if we have both user and budget ID
    if (!user || !budgetId) {
      return false;
    }

    // Get the budget
    const budget = await this.budgetService.findOne(budgetId);

    // Check if the user owns the budget
    if (budget.userId !== user.id) {
      throw new BudgetNotOwnerException(budgetId);
    }

    return true;
  }
}
