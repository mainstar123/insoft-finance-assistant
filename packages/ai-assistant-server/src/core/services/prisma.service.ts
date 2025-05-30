import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { db } from '@/core/integrations/database/db';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly prisma;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    this.prisma = db.getClient();
  }

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (error) {
      this.logger.error(
        `Failed to connect to the database: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      // Rethrow to prevent app from starting with a broken DB connection
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.prisma.$disconnect();
      this.logger.log('Successfully disconnected from the database');
    } catch (error) {
      this.logger.error(
        `Error disconnecting from the database: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  get client() {
    return this.prisma;
  }
}
