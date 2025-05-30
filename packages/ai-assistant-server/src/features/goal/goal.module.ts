import { Module } from '@nestjs/common';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { GoalOwnerGuard } from './guards/goal-owner.guard';
import { GoalCheckService } from './goal-check.service';

@Module({
  controllers: [GoalController],
  providers: [GoalService, GoalOwnerGuard, GoalCheckService],
  exports: [GoalService, GoalCheckService],
})
export class GoalModule {}
