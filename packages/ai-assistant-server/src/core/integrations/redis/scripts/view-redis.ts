/**
 * Script to help view Redis data
 * This provides instructions and options to view Redis data
 */
import { exec } from 'child_process';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../redis.service';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
          console.log('🚀 ~ redisUrl:', redisUrl);
        return new RedisService(redisUrl);
      },
      inject: [ConfigService],
    },
  ],
})
class AppModule {}

async function installRedisCommander() {
  try {
    console.log('🔍 Checking if redis-commander is installed...');
    await execAsync('npx redis-commander --version');
    return true;
  } catch (error) {
    console.log('⚠️ Redis commander not found. Installing...');
    try {
      await execAsync('npm install -g redis-commander');
      console.log('✅ Redis commander installed successfully');
      return true;
    } catch (installError) {
      console.error('❌ Failed to install redis-commander:', installError);
      return false;
    }
  }
}

async function checkRedisInsight() {
  try {
    console.log('🔍 Checking if RedisInsight is installed...');
    if (process.platform === 'darwin') {
      await execAsync('ls /Applications/RedisInsight*.app');
      return true;
    } else if (process.platform === 'win32') {
      await execAsync('where RedisInsight');
      return true;
    } else if (process.platform === 'linux') {
      await execAsync('which redisinsight');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function showKeyStats(redisService: RedisService) {
  console.log('\n📊 Redis Key Statistics:');

  // Get all keys
  const allKeys = await redisService.keys('*');
  console.log(`📌 Total keys: ${allKeys.length}`);

  // Group keys by pattern
  const patterns = [
    'tamy:conversation:*',
    'tamy:user:*',
    'tamy:memory:*',
    'tamy:thread:*',
    'langchain:*',
    'langgraph:*',
  ];

  for (const pattern of patterns) {
    const keys = await redisService.keys(pattern);
    if (keys.length > 0) {
      console.log(`📌 ${pattern}: ${keys.length} keys`);

      // Show some sample keys (up to 5)
      if (keys.length > 0) {
        const samples = keys.slice(0, 5);
        console.log('   Sample keys:');
        for (const key of samples) {
          console.log(`   - ${key}`);
        }
      }
    }
  }

  // Show other keys not matching the patterns
  const otherKeys = allKeys.filter(
    (key) => !patterns.some((pattern) => key.match(pattern.replace('*', '.*'))),
  );

  if (otherKeys.length > 0) {
    console.log(`📌 Other keys: ${otherKeys.length}`);
    const samples = otherKeys.slice(0, 5);
    console.log('   Sample keys:');
    for (const key of samples) {
      console.log(`   - ${key}`);
    }
  }
}

async function bootstrap() {
  console.log('🔍 Redis Studio Helper');
  console.log('=====================');

  try {
    // Create a minimal app context
    const app = await NestFactory.createApplicationContext(AppModule);
    const configService = app.get(ConfigService);
    const redisService = app.get(RedisService);

    // 1. Get Redis connection information
    const redisUrl =
      configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const parsedUrl = new URL(redisUrl);
    const host = parsedUrl.hostname;
    const port = parsedUrl.port || '6379';
    const auth = parsedUrl.password ? parsedUrl.password : '';

    console.log(`\n🔌 Connected to Redis at: ${host}:${port}`);

    // 2. Show key statistics
    await showKeyStats(redisService);

    // 3. Check for Redis GUI tools
    const hasRedisInsight = await checkRedisInsight();
    const hasRedisCommander = await installRedisCommander();

    console.log('\n🔧 Redis Viewer Options:');
    console.log('----------------------');

    // 4. Redis Commander option
    if (hasRedisCommander) {
      console.log('\n🚀 Option 1: Use Redis Commander (Web UI)');
      console.log('  Run this command in a new terminal:');
      console.log(
        `  npx redis-commander --redis-host ${host} --redis-port ${port}${auth ? ' --redis-password ' + auth : ''}`,
      );
      console.log('  Then open http://localhost:8081 in your browser');
    }

    // 5. RedisInsight option
    if (hasRedisInsight) {
      console.log('\n🚀 Option 2: Use RedisInsight (Desktop App)');
      console.log(
        '  Open the RedisInsight app and connect with these details:',
      );
      console.log(`  Host: ${host}`);
      console.log(`  Port: ${port}`);
      if (auth) {
        console.log(`  Password: ${auth}`);
      }
    } else {
      console.log('\n🚀 Option 2: Install RedisInsight (Recommended GUI)');
      console.log(
        '  Download from: https://redis.com/redis-enterprise/redis-insight/',
      );
      console.log('  After installing, connect with the details above');
    }

    // 6. CLI Option
    console.log('\n🚀 Option 3: Use Redis CLI');
    console.log(
      `  redis-cli -h ${host} -p ${port}${auth ? ' -a ' + auth : ''}`,
    );

    // 7. Start Redis Commander automatically if requested
    const args = process.argv.slice(2);
    if (args.includes('--start-commander') && hasRedisCommander) {
      console.log('\n🚀 Starting Redis Commander...');
      const commanderProcess = exec(
        `npx redis-commander --redis-host ${host} --redis-port ${port}${auth ? ' --redis-password ' + auth : ''}`,
      );

      commanderProcess.stdout?.on('data', (data) => {
        console.log(`Redis Commander: ${data}`);
      });

      console.log('✅ Redis Commander started on http://localhost:8081');
      console.log('   Press Ctrl+C to stop');

      // Keep the process running
      process.stdin.resume();
    } else {
      await app.close();
    }
  } catch (error) {
    console.error('❌ Failed to initialize Redis viewer helper:', error);
    process.exit(1);
  }
}

// Run the script
bootstrap();
