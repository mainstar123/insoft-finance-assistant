/**
 * Script to view Weaviate schema and data
 */
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import axios from 'axios';

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
  DIM: '\x1b[2m',
  UNDERSCORE: '\x1b[4m',
  BLINK: '\x1b[5m',
  REVERSE: '\x1b[7m',
  HIDDEN: '\x1b[8m',
  BLACK: '\x1b[30m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  BG_BLACK: '\x1b[40m',
  BG_RED: '\x1b[41m',
  BG_GREEN: '\x1b[42m',
  BG_YELLOW: '\x1b[43m',
  BG_BLUE: '\x1b[44m',
  BG_MAGENTA: '\x1b[45m',
  BG_CYAN: '\x1b[46m',
  BG_WHITE: '\x1b[47m',
};

async function bootstrap() {
  console.log(`${COLORS.CYAN}🔍 Weaviate Studio Helper${COLORS.RESET}`);
  console.log('=======================');

  try {
    // Create a minimal app context to get config
    const app = await NestFactory.createApplicationContext(AppModule);
    const configService = app.get(ConfigService);

    // Get Weaviate URL from config or use default
    const weaviateUrl =
      configService.get('WEAVIATE_URL') || 'http://localhost:8080';
    console.log(
      `\n${COLORS.GREEN}🔌 Connected to Weaviate at: ${weaviateUrl}${COLORS.RESET}`,
    );

    // Get Weaviate meta information
    const metaResponse = await axios.get(`${weaviateUrl}/v1/meta`);
    const { version, modules } = metaResponse.data;

    console.log(
      `\n${COLORS.BRIGHT}Weaviate Version:${COLORS.RESET} ${version}`,
    );
    console.log(
      `${COLORS.BRIGHT}Available Modules:${COLORS.RESET} ${Object.keys(modules || {}).join(', ')}`,
    );

    // Get schema information
    const schemaResponse = await axios.get(`${weaviateUrl}/v1/schema`);
    const classes = schemaResponse.data.classes || [];

    console.log(
      `\n${COLORS.YELLOW}${COLORS.BRIGHT}Available Classes (${classes.length}):${COLORS.RESET}`,
    );

    // Print class names and object counts
    for (const className of classes.map((c: any) => c.class)) {
      try {
        const countResponse = await axios.get(
          `${weaviateUrl}/v1/objects?class=${className}&limit=1`,
        );
        console.log(`  - ${COLORS.GREEN}${className}${COLORS.RESET}`);
      } catch (error: unknown) {
        console.log(`  - ${COLORS.RED}${className} (error)${COLORS.RESET}`);
      }
    }

    // Print usage instructions
    console.log(
      `\n${COLORS.MAGENTA}${COLORS.BRIGHT}How to view your data:${COLORS.RESET}`,
    );
    console.log(
      `  1. View schema: ${COLORS.CYAN}curl -X GET "${weaviateUrl}/v1/schema" | jq .${COLORS.RESET}`,
    );
    console.log(
      `  2. View class data: ${COLORS.CYAN}curl -X GET "${weaviateUrl}/v1/objects?class=<ClassName>&limit=10" | jq .${COLORS.RESET}`,
    );
    console.log(
      `  3. Search class data: ${COLORS.CYAN}curl -X GET "${weaviateUrl}/v1/objects?class=<ClassName>&limit=10&where=<Property>%3D%3D%22value%22" | jq .${COLORS.RESET}`,
    );

    console.log(
      `\n${COLORS.MAGENTA}${COLORS.BRIGHT}Online Options:${COLORS.RESET}`,
    );
    console.log(
      `  - Access Weaviate Console: ${COLORS.UNDERSCORE}https://console.weaviate.io/connect${COLORS.RESET}`,
    );
    console.log(`    Connect URL: ${weaviateUrl}`);

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
