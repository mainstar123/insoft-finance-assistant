import { Test, TestingModule } from '@nestjs/testing';
import { PrismaHealthIndicator } from './prisma.health';
import { PrismaService } from '@/core/services/prisma.service';
import { HealthIndicatorService } from '@nestjs/terminus';

describe('PrismaHealthIndicator', () => {
  let prismaHealthIndicator: PrismaHealthIndicator;
  let prismaService: PrismaService;
  let healthIndicatorService: HealthIndicatorService;

  const mockHealthIndicator = {
    up: jest.fn().mockReturnValue({ test: { status: 'up' } }),
    down: jest.fn().mockReturnValue({ test: { status: 'down' } }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaHealthIndicator,
        {
          provide: PrismaService,
          useValue: {
            client: {
              $queryRaw: jest.fn(),
            },
          },
        },
        {
          provide: HealthIndicatorService,
          useValue: {
            check: jest.fn().mockReturnValue(mockHealthIndicator),
          },
        },
      ],
    }).compile();

    prismaHealthIndicator = module.get<PrismaHealthIndicator>(
      PrismaHealthIndicator,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    healthIndicatorService = module.get<HealthIndicatorService>(
      HealthIndicatorService,
    );
  });

  it('should be defined', () => {
    expect(prismaHealthIndicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return up status when database is accessible', async () => {
      // Arrange
      prismaService.client.$queryRaw = jest.fn().mockResolvedValue([{ 1: 1 }]);

      // Act
      const result = await prismaHealthIndicator.isHealthy('test');

      // Assert
      expect(healthIndicatorService.check).toHaveBeenCalledWith('test');
      expect(prismaService.client.$queryRaw).toHaveBeenCalled();
      expect(mockHealthIndicator.up).toHaveBeenCalled();
      expect(result).toEqual({ test: { status: 'up' } });
    });

    it('should return down status when database is not accessible', async () => {
      // Arrange
      const error = new Error('Database connection error');
      prismaService.client.$queryRaw = jest.fn().mockRejectedValue(error);

      // Act
      const result = await prismaHealthIndicator.isHealthy('test');

      // Assert
      expect(healthIndicatorService.check).toHaveBeenCalledWith('test');
      expect(prismaService.client.$queryRaw).toHaveBeenCalled();
      expect(mockHealthIndicator.down).toHaveBeenCalledWith({
        message: error.message,
      });
      expect(result).toEqual({ test: { status: 'down' } });
    });
  });
});
