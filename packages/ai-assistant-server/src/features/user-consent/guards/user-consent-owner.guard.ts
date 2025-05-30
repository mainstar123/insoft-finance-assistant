import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserConsentService } from '../user-consent.service';

@Injectable()
export class UserConsentOwnerGuard implements CanActivate {
  constructor(private userConsentService: UserConsentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const consentId = request.params.id;

    if (!userId || !consentId) return false;

    const consent = await this.userConsentService.findOne(+consentId, +userId);
    return consent.userId === userId;
  }
}
