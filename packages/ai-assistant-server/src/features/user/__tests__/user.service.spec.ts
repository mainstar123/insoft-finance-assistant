import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/core/services';
import { UserService } from '../user.service';
import { Gender, FinancialGoal } from '@prisma/client';
import {
  UserNotFoundException,
  DuplicateUserException,
} from '../exceptions/user.exception';
import {
  getMockPrismaService,
  mockPrismaClient,
} from '@/test/mocks/prisma.service.mock';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    phoneNumber: null,
    termsAccepted: true,
    marketingConsent: false,
    country: null,
    locale: 'pt_BR',
    preferredCurrency: 'BRL',
    birthDate: null,
    gender: Gender.OTHER,
    primaryFinancialGoal: null,
    financialChallenge: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useFactory: getMockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
    });

    it('should create a new user with hashed password', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.user.create.mockResolvedValue(mockUser);

      const result = await service.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        termsAccepted: true,
        marketingConsent: false,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result).toEqual(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
        }),
      );
    });

    it('should create user with optional fields', async () => {
      const userWithOptionals = {
        ...mockUser,
        phoneNumber: '+1234567890',
        country: 'BR',
        gender: Gender.MALE,
        primaryFinancialGoal: FinancialGoal.SAVE_MONEY,
        financialChallenge: 'Paying off debt',
      };
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.user.create.mockResolvedValue(userWithOptionals);

      const result = await service.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        termsAccepted: true,
        marketingConsent: false,
        phoneNumber: '+1234567890',
        country: 'BR',
        gender: Gender.MALE,
      });

      expect(result.phoneNumber).toBe('+1234567890');
      expect(result.country).toBe('BR');
      expect(result.gender).toBe(Gender.MALE);
    });

    it('should throw DuplicateUserException for existing email', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          termsAccepted: true,
          marketingConsent: false,
        }),
      ).rejects.toThrow(DuplicateUserException);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(
        expect.objectContaining({
          id: 1,
          email: 'test@example.com',
        }),
      );
    });

    it('should return null when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(
        expect.objectContaining({
          email: 'test@example.com',
        }),
      );
    });

    it('should return null when user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updatedUser = {
        ...mockUser,
        locale: 'en_US',
        preferredCurrency: 'USD',
      };
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue(updatedUser);

      const result = await service.updatePreferences(1, {
        locale: 'en_US',
        preferredCurrency: 'USD',
      });

      expect(result.locale).toBe('en_US');
      expect(result.preferredCurrency).toBe('USD');
    });
  });

  describe('updateConsent', () => {
    it('should update user consent settings', async () => {
      const updatedUser = {
        ...mockUser,
        termsAccepted: true,
        marketingConsent: true,
      };
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateConsent(1, {
        termsAccepted: true,
        marketingConsent: true,
      });

      expect(result.termsAccepted).toBe(true);
      expect(result.marketingConsent).toBe(true);
    });
  });

  describe('update', () => {
    it('should update user details', async () => {
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(1, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should update password with hash', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'newHashedPassword',
      });

      await service.update(1, { password: 'newPassword123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
    });

    it('should throw UserNotFoundException for non-existent user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { name: 'New Name' })).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.delete.mockResolvedValue(mockUser);

      await service.remove(1);

      expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw UserNotFoundException for non-existent user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: 2, email: 'test2@example.com' },
      ];
      mockPrismaClient.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[1]?.email).toBe('test2@example.com');
    });
  });
});
