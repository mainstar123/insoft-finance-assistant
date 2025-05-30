import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { Gender, FinancialGoal } from '@prisma/client';
import { UserNotFoundException } from '../exceptions/user.exception';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
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

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByEmail: jest.fn(),
    updatePreferences: jest.fn(),
    updateConsent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        termsAccepted: true,
        marketingConsent: false,
      };
      mockUserService.create.mockResolvedValue(UserMapper.toEntity(mockUser));

      const result = await controller.create(createUserDto);

      expect(result).toEqual(
        UserMapper.toResponse(UserMapper.toEntity(mockUser)),
      );
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      mockUserService.findByEmail.mockResolvedValue(
        UserMapper.toEntity(mockUser),
      );

      const result = await controller.findByEmail('test@example.com');

      expect(result).toEqual(
        UserMapper.toResponse(UserMapper.toEntity(mockUser)),
      );
      expect(service.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(
        controller.findByEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updatedUser = {
        ...mockUser,
        locale: 'en_US',
        preferredCurrency: 'USD',
        primaryFinancialGoal: null,
        financialChallenge: null,
      };
      mockUserService.updatePreferences.mockResolvedValue(
        UserMapper.toEntity(updatedUser),
      );

      const result = await controller.updatePreferences('1', {
        locale: 'en_US',
        preferredCurrency: 'USD',
      });

      expect(result).toEqual(
        UserMapper.toResponse(UserMapper.toEntity(updatedUser)),
      );
    });
  });

  describe('updateConsent', () => {
    it('should update user consent settings', async () => {
      const updatedUser = {
        ...mockUser,
        termsAccepted: true,
        marketingConsent: true,
        primaryFinancialGoal: null,
        financialChallenge: null,
      };
      mockUserService.updateConsent.mockResolvedValue(
        UserMapper.toEntity(updatedUser),
      );

      const result = await controller.updateConsent('1', {
        termsAccepted: true,
        marketingConsent: true,
      });

      expect(result).toEqual(
        UserMapper.toResponse(UserMapper.toEntity(updatedUser)),
      );
    });
  });
});
