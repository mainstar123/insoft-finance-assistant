import { UserConsent } from '@prisma/client';
import { IUserConsent } from '../interfaces/user-consent.interface';
import { UserConsentResponseDto } from '../dto/user-consent-response.dto';

export class UserConsentMapper {
  static toEntity(prismaConsent: UserConsent): IUserConsent {
    return {
      id: prismaConsent.id,
      userId: prismaConsent.userId,
      type: prismaConsent.consentType,
      status: prismaConsent.consentedAt !== null,
      createdAt: prismaConsent.consentedAt || new Date(),
      updatedAt: prismaConsent.consentedAt || new Date(),
    };
  }

  static toResponse(consent: IUserConsent): UserConsentResponseDto {
    return new UserConsentResponseDto({
      id: consent.id,
      userId: consent.userId,
      type: consent.type,
      status: consent.status,
      createdAt: consent.createdAt,
      updatedAt: consent.updatedAt,
    });
  }
}
