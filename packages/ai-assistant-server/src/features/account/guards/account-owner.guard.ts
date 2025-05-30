import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AccountService } from '../account.service';

@Injectable()
export class AccountOwnerGuard implements CanActivate {
  constructor(private accountService: AccountService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const accountId = request.params.id;

    if (!userId || !accountId) return false;

    const account = await this.accountService.findOne(+accountId, +userId);
    return account.userId === userId;
  }
}
