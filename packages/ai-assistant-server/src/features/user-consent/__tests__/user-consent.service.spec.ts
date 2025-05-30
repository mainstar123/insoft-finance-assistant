import { Test } from '@nestjs/testing';
import { UserConsentService } from '../user-consent.service';
import { PrismaService } from '@/core/services';
import { UserConsentNotFoundException } from '../exceptions/user-consent.exception';

describe('UserConsentService', () => {
  let service: UserConsentService;
  let prismaService: PrismaService;

  const mockUserConsent = {
    id: 1,
    userId: 1,
    consentType: 'terms',
    consentedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    client: {
      userConsent: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserConsentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserConsentService>(UserConsentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a user consent', async () => {
      mockPrismaService.client.userConsent.create.mockResolvedValue(mockUserConsent);

      const result = await service.create({
        userId: 1,
        type: 'terms',
        status: true,
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe(1);
      expect(result.type).toBe('terms');
    });
  });

  describe('findAll', () => {
    it('should return all consents for a user', async () => {
      mockPrismaService.client.userConsent.findMany.mockResolvedValue([mockUserConsent]);

      const result = await service.findAll(1);

      expect(result).toHaveLength(1);
      expect(result[0]?.userId).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a single consent', async () => {
      mockPrismaService.client.userConsent.findFirst.mockResolvedValue(mockUserConsent);

      const result = await service.findOne(1, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw if consent not found', async () => {
      mockPrismaService.client.userConsent.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(UserConsentNotFoundException);
    });
  });

  describe('update', () => {
    it('should update consent status', async () => {
      mockPrismaService.client.userConsent.findFirst.mockResolvedValue(mockUserConsent);
      mockPrismaService.client.userConsent.update.mockResolvedValue({
        ...mockUserConsent,
        consentedAt: new Date(),
      });

      const result = await service.update(1, 1, true);

      expect(result).toBeDefined();
      expect(result.status).toBe(true);
    });

    it('should throw if consent not found during update', async () => {
      mockPrismaService.client.userConsent.findFirst.mockResolvedValue(null);

      await expect(service.update(999, 1, true)).rejects.toThrow(UserConsentNotFoundException);
    });
  });
});
