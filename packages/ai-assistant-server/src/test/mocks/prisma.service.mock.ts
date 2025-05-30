import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '@/core/services/prisma.service';

export const mockPrismaClient = mockDeep<PrismaClient>();

export const AccountType = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  INVESTMENT: 'INVESTMENT',
  BROKERAGE: 'BROKERAGE',
} as const;

export class MockPrismaService extends PrismaService {
  constructor() {
    super();
  }

  get client(): DeepMockProxy<PrismaClient> {
    return mockPrismaClient;
  }
}

export const getMockPrismaService = () => {
  return new MockPrismaService();
};
