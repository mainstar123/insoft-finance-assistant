import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/services';
import { RedisService } from '@/core/integrations/redis/redis.service';
import { addDays } from 'date-fns';

@Injectable()
export class SessionService {
  private readonly SESSION_EXPIRY_DAYS = 7;
  private readonly REDIS_SESSION_PREFIX = 'session:';

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async createSession(userId: string, token: string, device?: string) {
    const expiresAt = addDays(new Date(), this.SESSION_EXPIRY_DAYS);

    // Create session in database
    const session = await this.prisma.client.session.create({
      data: {
        userId: parseInt(userId),
        token,
        device,
        expiresAt,
      },
    });

    // Store session in Redis for quick lookups
    await this.redisService.set(
      `${this.REDIS_SESSION_PREFIX}${token}`,
      JSON.stringify({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
      }),
      this.SESSION_EXPIRY_DAYS * 24 * 60 * 60, // Redis expiry in seconds
    );

    return session;
  }

  async validateSession(token: string) {
    // Try Redis first
    const cachedSession = await this.redisService.get(
      `${this.REDIS_SESSION_PREFIX}${token}`,
    );

    if (cachedSession) {
      const session = JSON.parse(cachedSession);
      if (new Date(session.expiresAt) > new Date()) {
        return session;
      }
      // Session expired, remove it
      await this.removeSession(token);
      return null;
    }

    // Fallback to database
    const session = await this.prisma.client.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.removeSession(token);
      }
      return null;
    }

    // Cache session in Redis
    await this.redisService.set(
      `${this.REDIS_SESSION_PREFIX}${token}`,
      JSON.stringify({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
      }),
      this.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    );

    return session;
  }

  async updateSession(sessionId: string, newToken: string) {
    const session = await this.prisma.client.session.update({
      where: { id: sessionId },
      data: {
        token: newToken,
        lastActivity: new Date(),
        expiresAt: addDays(new Date(), this.SESSION_EXPIRY_DAYS),
      },
    });

    // Update Redis
    await this.redisService.set(
      `${this.REDIS_SESSION_PREFIX}${newToken}`,
      JSON.stringify({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
      }),
      this.SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    );

    return session;
  }

  async removeSession(token: string) {
    // Remove from Redis
    await this.redisService.del(`${this.REDIS_SESSION_PREFIX}${token}`);

    // Remove from database
    await this.prisma.client.session.deleteMany({
      where: { token },
    });
  }

  async removeUserSessions(userId: string) {
    const sessions = await this.prisma.client.session.findMany({
      where: { userId: parseInt(userId) },
    });

    // Remove all sessions from Redis
    await Promise.all(
      sessions.map((session) =>
        this.redisService.del(`${this.REDIS_SESSION_PREFIX}${session.token}`),
      ),
    );

    // Remove all sessions from database
    await this.prisma.client.session.deleteMany({
      where: { userId: parseInt(userId) },
    });
  }
}
