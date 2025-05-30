import { Module } from '@nestjs/common';
import { UserConsentController } from './user-consent.controller';
import { UserConsentService } from './user-consent.service';
import { UserConsentOwnerGuard } from './guards/user-consent-owner.guard';

@Module({
  controllers: [UserConsentController],
  providers: [UserConsentService, UserConsentOwnerGuard],
  exports: [UserConsentService],
})
export class UserConsentModule {}
