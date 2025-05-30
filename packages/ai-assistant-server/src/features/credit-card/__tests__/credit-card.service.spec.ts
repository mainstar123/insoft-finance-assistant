import { Test, TestingModule } from '@nestjs/testing';
import { CreditCardService } from '../credit-card.service';
import { PrismaService } from '@/core/services/prisma.service';
import { CreateCreditCardDto } from '../dto/create-credit-card.dto';
import { NotFoundException } from '@nestjs/common';

describe('CreditCardService', () => {
  let service: CreditCardService;
  let prisma: PrismaService;

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
      providers: [
        CreditCardService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              creditCard: {
                create: jest.fn().mockResolvedValue(mockCreditCard),
                findMany: jest.fn().mockResolvedValue([mockCreditCard]),
                findUnique: jest.fn().mockResolvedValue(mockCreditCard),
                update: jest.fn().mockResolvedValue(mockCreditCard),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<CreditCardService>(CreditCardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a credit card', async () => {
      const result = await service.create(mockCreateDto);
      expect(result).toEqual(mockCreditCard);
      expect(prisma.client.creditCard.create).toHaveBeenCalledWith({
        data: {
          ...mockCreateDto,
          limitPercentage: 0,
          currentDebtCents: 0,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all active credit cards for a user', async () => {
      const userId = 1;
      const result = await service.findAll(userId);
      expect(result).toEqual([mockCreditCard]);
      expect(prisma.client.creditCard.findMany).toHaveBeenCalledWith({
        where: { userId, isArchived: false },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a credit card by id', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockCreditCard);
      expect(prisma.client.creditCard.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when credit card not found', async () => {
      jest
        .spyOn(prisma.client.creditCard, 'findUnique')
        .mockResolvedValueOnce(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a credit card', async () => {
      const updateData = { name: 'Updated Card' };
      const result = await service.update(1, updateData);
      expect(result).toEqual(mockCreditCard);
      expect(prisma.client.creditCard.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });
  });

  describe('remove', () => {
    it('should archive a credit card', async () => {
      const result = await service.remove(1);
      expect(result).toEqual(mockCreditCard);
      expect(prisma.client.creditCard.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isArchived: true },
      });
    });
  });
});
