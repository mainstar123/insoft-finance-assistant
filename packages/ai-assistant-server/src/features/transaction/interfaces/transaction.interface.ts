import { TransactionType } from '@/core/integrations/database/types';

export interface ITransaction {
  id: number;
  userId: number;
  accountId: number;
  oppositeAccountId?: number | null;
  investmentAsset?: string | null;
  investmentType?: string | null;
  broker?: string | null;
  description: string;
  transactionDate: Date;
  amountCents: number;
  categoryId?: number | null;
  subCategoryId?: number | null;
  invoiceId?: number | null;
  currency: string;
  isArchived: boolean;
  isPaid: boolean;
  transactionType: TransactionType;
  createdAt: Date;
  updatedAt: Date;
}
