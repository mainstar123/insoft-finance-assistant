import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { Gender } from '../../enums/gender.enum';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

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
});
