/**
 * Script to clean up the Redis database
 * This will flush all data from Redis
 */
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),
  ],
  providers: [
    ConfigService,
    {
      provide: RedisService,
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
          console.log("🚀 ~ redisUrl:", redisUrl)
        return new RedisService(redisUrl);
      },
      inject: [ConfigService],
    },
  ],
})
class AppModule {}

async function bootstrap() {
  console.log('🧹 Starting Redis cleanup...');

  try {
    // Create a minimal app context
    const app = await NestFactory.createApplicationContext(AppModule);
    const redisService = app.get(RedisService);

    // Option 1: Flush all data (removes everything)
    console.log('📊 Flushing all Redis data...');
    await redisService.flushdb();
    console.log('✅ Successfully flushed all Redis data');

    // Option 2: Selectively clean up by key patterns
    // Uncomment this section if you want to selectively delete keys
    /*
    const patterns = [
      'tamy:conversation:*',   // Conversation data
      'tamy:user:*',           // User-related data
      'tamy:memory:*',         // Memory-related data
      'tamy:thread:*',         // Thread data
    ];

    for (const pattern of patterns) {
      console.log(`📊 Cleaning up Redis keys matching: ${pattern}`);
      const keys = await redisService.keys(pattern);

      if (keys.length > 0) {
        for (const key of keys) {
          await redisService.del(key);
        }
        console.log(`✅ Successfully deleted ${keys.length} keys matching ${pattern}`);
      } else {
        console.log(`ℹ️ No keys found matching ${pattern}`);
      }
    }
    */

    console.log('🎉 Redis cleanup completed successfully');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to cleanup Redis:', error);
    process.exit(1);
  }
}

bootstrap();
