import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetCheckService } from './budget-check.service';
import { BudgetController } from './budget.controller';

@Module({
  controllers: [BudgetController],
  providers: [BudgetService, BudgetCheckService],
  exports: [BudgetService, BudgetCheckService],
})
export class BudgetModule {}
