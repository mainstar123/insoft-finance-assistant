import { Module } from '@nestjs/common';
import { VisualizationService } from './services/visualization.service';
import { ChartGeneratorService } from './services/chart-generator.service';
import { VisualizationController } from './controllers/visualization.controller';
import { TransactionModule } from '../transaction/transaction.module';
import { BudgetModule } from '../budget/budget.module';
import { CreditCardModule } from '../credit-card/credit-card.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { CategoryModule } from '../category/category.module';
import { GoalModule } from '../goal/goal.module';

/**
 * Module for financial data visualization
 */
@Module({
  imports: [
    TransactionModule,
    BudgetModule,
    CreditCardModule,
    InvoiceModule,
    CategoryModule,
    GoalModule,
  ],
  controllers: [VisualizationController],
  providers: [VisualizationService, ChartGeneratorService],
  exports: [VisualizationService],
})
export class VisualizationModule {}
