import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserConsentService } from '../user-consent.service';
import { UserConsentOwnerGuard } from '../guards/user-consent-owner.guard';

describe('UserConsentOwnerGuard', () => {
  let guard: UserConsentOwnerGuard;
  let service: UserConsentService;

  const mockConsent = {
    id: 1,
    userId: 1,
    type: 'terms',
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserConsentService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserConsentOwnerGuard,
        {
          provide: UserConsentService,
          useValue: mockUserConsentService,
        },
      ],
    }).compile();

    guard = module.get<UserConsentOwnerGuard>(UserConsentOwnerGuard);
    service = module.get<UserConsentService>(UserConsentService);
  });

  describe('canActivate', () => {
    it('should allow access when user owns the consent', async () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
            params: { id: 1 },
          }),
        }),
      } as ExecutionContext;

      mockUserConsentService.findOne.mockResolvedValue(mockConsent);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(service.findOne).toHaveBeenCalledWith(1, 1);
    });

    it('should deny access when user does not own the consent', async () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 2 },
            params: { id: 1 },
          }),
        }),
      } as ExecutionContext;

      mockUserConsentService.findOne.mockResolvedValue(mockConsent);

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
