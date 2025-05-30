import { Test } from '@nestjs/testing';
import { UserConsentController } from '../user-consent.controller';
import { UserConsentService } from '../user-consent.service';
import { CreateUserConsentDto } from '../dto/create-user-consent.dto';

describe('UserConsentController', () => {
  let controller: UserConsentController;
  let service: UserConsentService;

  const mockUserConsent = {
    id: 1,
    userId: 1,
    type: 'terms',
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserConsentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserConsentController],
      providers: [
        {
          provide: UserConsentService,
          useValue: mockUserConsentService,
        },
      ],
    }).compile();

    controller = module.get<UserConsentController>(UserConsentController);
    service = module.get<UserConsentService>(UserConsentService);
  });

  describe('create', () => {
    it('should create a user consent', async () => {
      const dto: CreateUserConsentDto = {
        userId: 1,
        type: 'terms',
        status: true,
      };

      mockUserConsentService.create.mockResolvedValue(mockUserConsent);

      const result = await controller.create(dto);

      expect(result).toBeDefined();
      expect(result.userId).toBe(dto.userId);
      expect(result.type).toBe(dto.type);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all consents for a user', async () => {
      mockUserConsentService.findAll.mockResolvedValue([mockUserConsent]);

      const result = await controller.findAll(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('updateStatus', () => {
    it('should update consent status', async () => {
      mockUserConsentService.update.mockResolvedValue({
        ...mockUserConsent,
        status: false,
      });

      const result = await controller.updateStatus(1, 1, false);

      expect(result).toBeDefined();
      expect(result.status).toBe(false);
      expect(service.update).toHaveBeenCalledWith(1, 1, false);
    });
  });
});
