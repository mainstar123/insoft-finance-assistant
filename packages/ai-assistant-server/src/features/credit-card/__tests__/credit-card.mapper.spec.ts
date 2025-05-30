import { CreditCardMapper } from '../mappers/credit-card.mapper';
import { CreditCard } from '@prisma/client';

describe('CreditCardMapper', () => {
  describe('toResponse', () => {
    it('should correctly map CreditCard to CreditCardResponseDto', () => {
      const creditCard: CreditCard = {
        id: 1,
        userId: 1,
        name: 'Test Card',
        description: 'Test Description',
        cardNetwork: 'visa',
        closingDay: 5,
        dueDay: 10,
        limitCents: 1000000,
        limitPercentage: 0,
        currentDebtCents: 0,
        isDefault: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = CreditCardMapper.toResponse(creditCard);

      expect(result).toEqual({
        id: creditCard.id,
        userId: creditCard.userId,
        name: creditCard.name,
        description: creditCard.description,
        cardNetwork: creditCard.cardNetwork,
        closingDay: creditCard.closingDay,
        dueDay: creditCard.dueDay,
        limitCents: creditCard.limitCents,
        limitPercentage: creditCard.limitPercentage,
        currentDebtCents: creditCard.currentDebtCents,
        isDefault: creditCard.isDefault,
        isArchived: creditCard.isArchived,
        createdAt: creditCard.createdAt,
        updatedAt: creditCard.updatedAt,
      });
    });

    it('should handle null optional fields', () => {
      const creditCard: CreditCard = {
        id: 1,
        userId: 1,
        name: 'Test Card',
        description: null,
        cardNetwork: null,
        closingDay: 5,
        dueDay: 10,
        limitCents: 1000000,
        limitPercentage: 0,
        currentDebtCents: 0,
        isDefault: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = CreditCardMapper.toResponse(creditCard);

      expect(result.description).toBeUndefined();
      expect(result.cardNetwork).toBeUndefined();
    });
  });
});
