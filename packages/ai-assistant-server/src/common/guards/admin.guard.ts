import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Guard to protect admin-only routes
 */
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if user exists and has admin role
    if (!request.user || !(request.user as any).roles?.includes('admin')) {
      throw new UnauthorizedException('Admin access required');
    }

    return true;
  }
}
