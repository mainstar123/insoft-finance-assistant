import { Account } from '@/core/integrations/database/types';
import { IAccount } from '../interfaces/account.interface';
import { AccountResponseDto } from '../dto/account-response.dto';

export class AccountMapper {
  static toEntity(prismaAccount: Account): IAccount {
    return {
      ...prismaAccount,
      description: prismaAccount.description || undefined,
    };
  }

  static toResponse(account: IAccount): AccountResponseDto {
    return new AccountResponseDto(account);
  }
}
