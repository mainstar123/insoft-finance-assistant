import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthCheck } from './core/interfaces/health.interface';
import { HealthService } from './core/services';

describe('AppController', () => {
  let app: TestingModule;
  let appController: AppController;
  let appService: AppService;

  const mockHealthService = {
    checkHealth: jest.fn(),
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    appController = app.get(AppController);
    appService = app.get(AppService);
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const mockHealthCheck: HealthCheck = {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };

      mockHealthService.checkHealth.mockResolvedValue(mockHealthCheck);

      const result = await appController.getHealth();
      expect(result).toEqual(mockHealthCheck);
      expect(mockHealthService.checkHealth).toHaveBeenCalled();
    });
  });
});
