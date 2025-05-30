/**
 * Script to open the Weaviate UI in the browser
 */
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),
  ],
  providers: [ConfigService],
})
class AppModule {}

const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  RED: '\x1b[31m',
  MAGENTA: '\x1b[35m',
  BLUE: '\x1b[34m',
};

async function bootstrap() {
  console.log(`${COLORS.CYAN}🔍 Opening Weaviate UI${COLORS.RESET}`);
  console.log('=======================');

  try {
    // Create a minimal app context to get config
    const app = await NestFactory.createApplicationContext(AppModule);
    const configService = app.get(ConfigService);

    // Get Weaviate URL from config or use default
    const weaviateUrl =
      configService.get('WEAVIATE_URL') || 'http://localhost:8080';
    const weaviateUIUrl = 'http://localhost:3100'; // The UI is exposed on port 3100

    console.log(
      `${COLORS.GREEN}1. Local Weaviate Playground:${COLORS.RESET} ${weaviateUIUrl}`,
    );

    // Dynamically import open
    try {
      const openModule = await import('open');
      await openModule.default(weaviateUIUrl);
      console.log(`${COLORS.GREEN}Browser opening...${COLORS.RESET}`);
    } catch (error) {
      console.log(
        `${COLORS.YELLOW}Could not automatically open browser. Please visit: ${weaviateUIUrl}${COLORS.RESET}`,
      );
    }

    console.log(
      `${COLORS.YELLOW}2. Online Weaviate Console:${COLORS.RESET} https://console.weaviate.io/connect`,
    );
    console.log(`   Connect to:${COLORS.CYAN} ${weaviateUrl}${COLORS.RESET}`);

    console.log(
      `\n${COLORS.BLUE}Either option will allow you to browse your Weaviate data visually.${COLORS.RESET}`,
    );
    console.log(
      `${COLORS.BLUE}If the local UI is not available, try:${COLORS.RESET} docker compose -f packages/ai-assistant-server/docker-compose.yml up -d`,
    );

    await app.close();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `${COLORS.RED}❌ Failed to initialize Weaviate viewer helper:${COLORS.RESET}`,
      errorMessage,
    );
    process.exit(1);
  }
}

bootstrap();
