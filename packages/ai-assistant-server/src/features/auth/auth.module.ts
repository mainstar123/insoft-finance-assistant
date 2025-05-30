import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@/config/config.module';
import { ConfigService } from '@/config/config.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionService } from './session.service';
import { RedisModule } from '@/core/integrations/redis/redis.module';
import { PrismaService } from '@/core/services';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getAppConfig().jwtSecret,
        signOptions: {
          expiresIn: '15m', // Short-lived JWT tokens
        },
      }),
      inject: [ConfigService],
    }),
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionService, JwtStrategy, PrismaService],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
