import { CreditCard } from '@prisma/client';
import { CreditCardResponseDto } from '../dto/credit-card-response.dto';

export class CreditCardMapper {
  static toResponse(creditCard: CreditCard): CreditCardResponseDto {
    return {
      id: creditCard.id,
      userId: creditCard.userId,
      name: creditCard.name,
      description: creditCard.description ?? undefined,
      cardNetwork: creditCard.cardNetwork ?? undefined,
      closingDay: creditCard.closingDay,
      dueDay: creditCard.dueDay,
      limitCents: creditCard.limitCents,
      limitPercentage: creditCard.limitPercentage,
      currentDebtCents: creditCard.currentDebtCents,
      isDefault: creditCard.isDefault,
      isArchived: creditCard.isArchived,
      createdAt: creditCard.createdAt,
      updatedAt: creditCard.updatedAt,
    };
  }
}
