import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TransactionService } from '../transaction.service';

@Injectable()
export class TransactionOwnerGuard implements CanActivate {
  constructor(private transactionService: TransactionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const transactionId = request.params.id;

    if (!userId || !transactionId) return false;

    const transaction = await this.transactionService.findOne(+transactionId);
    return transaction.userId === userId;
  }
}
