import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/core/services';
import { SessionService } from '@/features/auth/session.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private sessionService: SessionService,
  ) {}

  async signup(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    // Check if user exists
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.client.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id.toString());

    // Create session
    await this.sessionService.createSession(user.id.toString()  , refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  async signin(email: string, password: string) {
    // Find user
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id.toString());

    // Create session
    await this.sessionService.createSession(user.id.toString(), refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    const session = await this.sessionService.validateSession(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(session.userId);

    // Update session with new refresh token
    await this.sessionService.updateSession(session.id, newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async signout(refreshToken: string) {
    await this.sessionService.removeSession(refreshToken);
  }

  private async generateTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId },
        { expiresIn: '15m' }, // Short-lived access token
      ),
      this.jwtService.signAsync(
        { sub: userId },
        { expiresIn: '7d' }, // Long-lived refresh token
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
