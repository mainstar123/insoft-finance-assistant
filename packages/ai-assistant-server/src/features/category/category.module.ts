import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryOwnerGuard } from './guards/category-owner.guard';
import { TransactionCategorizationService } from './transaction-categorization.service';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryOwnerGuard,
    TransactionCategorizationService,
  ],
  exports: [CategoryService, TransactionCategorizationService],
})
export class CategoryModule {}
