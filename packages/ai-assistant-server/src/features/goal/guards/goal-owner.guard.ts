import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GoalService } from '../goal.service';
import { GoalNotFoundException } from '../exceptions/goal.exception';

@Injectable()
export class GoalOwnerGuard implements CanActivate {
  constructor(private goalService: GoalService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const goalId = request.params.id;

    if (!userId || !goalId) {
      return false;
    }

    try {
      const goal = await this.goalService.findOne(+goalId);
      return goal.userId === userId;
    } catch (error) {
      // Handle both GoalNotFoundException and invalid ID errors
      return false;
    }
  }
}
