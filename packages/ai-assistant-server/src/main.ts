// Import necessary modules
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerConfig } from './core/services/logger.config';
import { ConfigService } from './config';

async function bootstrap() {
  // Create a logger instance for bootstrap
  const bootstrapLogger = LoggerConfig.createNestLogger('Bootstrap');

  try {
    // Create the application with the configured logger
    const app = await NestFactory.create(AppModule, {
      logger: LoggerConfig.createNestLogger('Application'),
      bodyParser: false, // Disable built-in body parser
    });

    const configService = app.get(ConfigService);
    const appConfig = configService.getAppConfig();

    // Use compression middleware
    app.use(compression());

    // Use Helmet for security headers
    app.use(helmet());

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that do not have any decorators
        transform: true, // Automatically transform payloads to DTO instances
        forbidNonWhitelisted: true, // Throw errors if non-whitelisted values are provided
      }),
    );

    // Security headers
    app.enableCors({
      origin: configService.isProduction()
        ? [appConfig.frontendUrl, appConfig.adminDashboardUrl]
        : appConfig.corsOrigin,
    });

    const port = appConfig.port;
    await app.listen(port);

    bootstrapLogger.log(
      `🚀 Application is running on: http://localhost:${port}`,
    );
    bootstrapLogger.log(`📁 Logs are being saved to: ${process.cwd()}/logs/`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    bootstrapLogger.error(
      `Failed to start application: ${errorMessage}`,
      errorStack,
    );
    process.exit(1);
  }
}

bootstrap();
