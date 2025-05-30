import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionOwnerGuard } from './guards/transaction-owner.guard';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, TransactionOwnerGuard],
  exports: [TransactionService],
})
export class TransactionModule {}
