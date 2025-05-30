import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardController } from '../credit-card.controller';
import { CreditCardService } from '../credit-card.service';
import { CreateCreditCardDto } from '../dto/create-credit-card.dto';
import { CreditCardMapper } from '../mappers/credit-card.mapper';

describe('CreditCardController', () => {
  let controller: CreditCardController;
  let service: CreditCardService;

  const mockCreditCard = {
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

  const mockCreateDto: CreateCreditCardDto = {
    userId: 1,
    name: 'Test Card',
    description: 'Test Description',
    cardNetwork: 'visa',
    closingDay: 5,
    dueDay: 10,
    limitCents: 1000000,
    isDefault: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditCardController],
      providers: [
        {
          provide: CreditCardService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockCreditCard),
            findAll: jest.fn().mockResolvedValue([mockCreditCard]),
            findOne: jest.fn().mockResolvedValue(mockCreditCard),
            update: jest.fn().mockResolvedValue(mockCreditCard),
            remove: jest.fn().mockResolvedValue(mockCreditCard),
          },
        },
      ],
    }).compile();

    controller = module.get<CreditCardController>(CreditCardController);
    service = module.get<CreditCardService>(CreditCardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a credit card', async () => {
      const result = await controller.create(mockCreateDto);
      expect(result).toEqual(CreditCardMapper.toResponse(mockCreditCard));
      expect(service.create).toHaveBeenCalledWith(mockCreateDto);
    });
  });

  describe('findAll', () => {
    it('should return all credit cards for a user', async () => {
      const result = await controller.findAll(1);
      expect(result).toEqual([CreditCardMapper.toResponse(mockCreditCard)]);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a credit card by id', async () => {
      const result = await controller.findOne(1);
      expect(result).toEqual(CreditCardMapper.toResponse(mockCreditCard));
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a credit card', async () => {
      const updateData = { name: 'Updated Card' };
      const result = await controller.update(1, updateData);
      expect(result).toEqual(CreditCardMapper.toResponse(mockCreditCard));
      expect(service.update).toHaveBeenCalledWith(1, updateData);
    });
  });

  describe('remove', () => {
    it('should archive a credit card', async () => {
      const result = await controller.remove(1);
      expect(result).toEqual(CreditCardMapper.toResponse(mockCreditCard));
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
