import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardService } from '../credit-card.service';
import { CreditCardOwnerGuard } from '../guards/credit-card-owner.guard';

describe('CreditCardOwnerGuard', () => {
  let guard: CreditCardOwnerGuard;
  let service: CreditCardService;

  const mockCreditCard = {
    id: 1,
    userId: 1,
    name: 'Test Card',
    description: null,
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

  const mockCreditCardService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditCardOwnerGuard,
        {
          provide: CreditCardService,
          useValue: mockCreditCardService,
        },
      ],
    }).compile();

    guard = module.get<CreditCardOwnerGuard>(CreditCardOwnerGuard);
    service = module.get<CreditCardService>(CreditCardService);
  });

  describe('canActivate', () => {
    it('should allow access when user owns the credit card', async () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: 1 },
          }),
        }),
      } as ExecutionContext;

      mockCreditCardService.findOne.mockResolvedValue(mockCreditCard);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should deny access when user does not own the credit card', async () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 2 },
            params: { id: 1 },
          }),
        }),
      } as ExecutionContext;

      mockCreditCardService.findOne.mockResolvedValue(mockCreditCard);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should deny access when user is not authenticated', async () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: 1 },
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });
  });
});
