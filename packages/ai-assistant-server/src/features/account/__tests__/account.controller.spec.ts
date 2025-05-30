import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from '../account.controller';
import { AccountService } from '../account.service';
import { AccountMapper } from '../mappers/account.mapper';
import { IAccount } from '../interfaces/account.interface';
import { AccountType } from '@/test/mocks/prisma.service.mock';

describe('AccountController', () => {
  let controller: AccountController;
  let service: AccountService;

  const mockAccount: IAccount = {
    id: 1,
    userId: 1,
    name: 'Test Account',
    description: undefined,
    balanceCents: 1000,
    balanceCurrency: 'BRL',
    type: AccountType.CHECKING,
    isDefault: false,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccountService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: mockAccountService,
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    service = module.get<AccountService>(AccountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an account', async () => {
      mockAccountService.create.mockResolvedValue(mockAccount);

      const result = await controller.create({
        userId: 1,
        name: 'Test Account',
        balanceCents: 1000,
        balanceCurrency: 'BRL',
        type: AccountType.CHECKING,
        isDefault: false,
      });

      expect(result).toEqual(AccountMapper.toResponse(mockAccount));
      expect(service.create).toHaveBeenCalled();
    });

    it('should handle account creation with optional fields', async () => {
      const accountWithDescription = {
        ...mockAccount,
        description: 'Test Description',
      };
      mockAccountService.create.mockResolvedValue(accountWithDescription);

      const result = await controller.create({
        userId: 1,
        name: 'Test Account',
        description: 'Test Description',
        balanceCents: 1000,
        balanceCurrency: 'BRL',
        type: AccountType.CHECKING,
        isDefault: false,
      });

      expect(result.description).toBe('Test Description');
    });
  });

  describe('findAll', () => {
    it('should return all accounts for a user', async () => {
      mockAccountService.findAll.mockResolvedValue([mockAccount]);

      const result = await controller.findAll(1);

      expect(result).toEqual([AccountMapper.toResponse(mockAccount)]);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });

    it('should handle empty account list', async () => {
      mockAccountService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(1);

      expect(result).toEqual([]);
    });

    it('should map multiple accounts to response DTOs', async () => {
      const accounts = [
        mockAccount,
        { ...mockAccount, id: 2, name: 'Second Account' },
      ];
      mockAccountService.findAll.mockResolvedValue(accounts);

      const result = await controller.findAll(1);

      expect(result).toHaveLength(2);
      expect(result[1]?.name).toBe('Second Account');
    });
  });

  describe('findOne', () => {
    it('should return a single account', async () => {
      mockAccountService.findOne.mockResolvedValue(mockAccount);

      const result = await controller.findOne(1, { user: { id: 1 } });

      expect(result).toEqual(AccountMapper.toResponse(mockAccount));
      expect(service.findOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      mockAccountService.update.mockResolvedValue(mockAccount);

      const result = await controller.update(1, 1, { name: 'Updated Account' });

      expect(result).toEqual(AccountMapper.toResponse(mockAccount));
      expect(service.update).toHaveBeenCalledWith(1, 1, {
        name: 'Updated Account',
      });
    });

    it('should handle partial updates', async () => {
      const updatedAccount = { ...mockAccount, name: 'Updated Name' };
      mockAccountService.update.mockResolvedValue(updatedAccount);

      const result = await controller.update(1, 1, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(service.update).toHaveBeenCalledWith(1, 1, {
        name: 'Updated Name',
      });
    });
  });

  describe('remove', () => {
    it('should remove an account', async () => {
      await controller.remove(1, 1);

      expect(service.remove).toHaveBeenCalledWith(1, 1);
    });

    it('should handle successful account removal', async () => {
      mockAccountService.remove.mockResolvedValue(undefined);

      await expect(controller.remove(1, 1)).resolves.not.toThrow();
    });
  });

  describe('setDefault', () => {
    it('should set an account as default', async () => {
      mockAccountService.setDefault.mockResolvedValue(mockAccount);

      const result = await controller.setDefault(1, 1);

      expect(result).toEqual(AccountMapper.toResponse(mockAccount));
      expect(service.setDefault).toHaveBeenCalledWith(1, 1);
    });
  });
});
