import { Transaction } from '@/core/integrations/database/types';
import { ITransaction } from '../interfaces/transaction.interface';
import { TransactionResponseDto } from '../dto/transaction-response.dto';

export class TransactionMapper {
  static toEntity(prismaTransaction: Transaction): ITransaction {
    return {
      id: prismaTransaction.id,
      userId: prismaTransaction.userId,
      accountId: prismaTransaction.accountId,
      oppositeAccountId: prismaTransaction.oppositeAccountId || undefined,
      investmentAsset: prismaTransaction.investmentAsset || undefined,
      investmentType: prismaTransaction.investmentType || undefined,
      broker: prismaTransaction.broker || undefined,
      description: prismaTransaction.description,
      transactionDate: prismaTransaction.transactionDate,
      amountCents: prismaTransaction.amountCents,
      categoryId: prismaTransaction.categoryId || undefined,
      subCategoryId: prismaTransaction.subCategoryId || undefined,
      invoiceId: prismaTransaction.invoiceId || undefined,
      currency: prismaTransaction.currency,
      isArchived: prismaTransaction.isArchived,
      isPaid: prismaTransaction.isPaid,
      transactionType: prismaTransaction.transactionType,
      createdAt: prismaTransaction.createdAt,
      updatedAt: prismaTransaction.updatedAt,
    };
  }

  static toResponse(transaction: ITransaction): TransactionResponseDto {
    const response: TransactionResponseDto = {
      id: transaction.id,
      userId: transaction.userId,
      accountId: transaction.accountId,
      description: transaction.description,
      amountCents: transaction.amountCents,
      currency: transaction.currency,
      type: transaction.transactionType,
      date: transaction.transactionDate,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      isArchived: transaction.isArchived,
      isPaid: transaction.isPaid,
    };

    // Add optional fields only if they exist
    if (transaction.oppositeAccountId)
      response.oppositeAccountId = transaction.oppositeAccountId;
    if (transaction.investmentAsset)
      response.investmentAsset = transaction.investmentAsset;
    if (transaction.investmentType)
      response.investmentType = transaction.investmentType;
    if (transaction.broker) response.broker = transaction.broker;
    if (transaction.categoryId) response.categoryId = transaction.categoryId;
    if (transaction.subCategoryId)
      response.subCategoryId = transaction.subCategoryId;
    if (transaction.invoiceId) response.invoiceId = transaction.invoiceId;

    return response;
  }
}
