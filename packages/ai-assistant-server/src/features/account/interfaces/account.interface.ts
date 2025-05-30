import { AccountType } from '@/core/integrations/database/types';

export interface IAccount {
  id: number;
  userId: number;
  name: string;
  description: string | undefined;
  balanceCents: number;
  balanceCurrency: string;
  type: AccountType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}
