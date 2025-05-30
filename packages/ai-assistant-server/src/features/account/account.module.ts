import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountOwnerGuard } from './guards/account-owner.guard';

@Module({
  controllers: [AccountController],
  providers: [AccountService, AccountOwnerGuard],
  exports: [AccountService],
})
export class AccountModule {}
