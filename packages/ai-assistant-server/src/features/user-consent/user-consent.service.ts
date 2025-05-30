import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@/core/services';
import { CreateUserConsentDto } from './dto/create-user-consent.dto';
import { IUserConsent } from './interfaces/user-consent.interface';
import { UserConsentMapper } from './mappers/user-consent.mapper';
import { UserConsentNotFoundException } from './exceptions/user-consent.exception';

@Injectable()
export class UserConsentService {
  private readonly prisma: PrismaClient;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService.client;
  }

  async create(createDto: CreateUserConsentDto): Promise<IUserConsent> {
    const consent = await this.prisma.userConsent.create({
      data: {
        ...createDto,
        consentType: createDto.type,
      },
    });
    return UserConsentMapper.toEntity(consent);
  }

  async findAll(userId: number): Promise<IUserConsent[]> {
    const consents = await this.prisma.userConsent.findMany({
      where: { userId },
    });
    return consents.map(UserConsentMapper.toEntity);
  }

  async findOne(id: number, userId: number): Promise<IUserConsent> {
    const consent = await this.prisma.userConsent.findFirst({
      where: { id, userId },
    });

    if (!consent) {
      throw new UserConsentNotFoundException(id);
    }

    return UserConsentMapper.toEntity(consent);
  }

  async update(
    id: number,
    userId: number,
    status: boolean,
  ): Promise<IUserConsent> {
    await this.findOne(id, userId);

    const consent = await this.prisma.userConsent.update({
      where: { id },
      data: {
        consentedAt: status ? new Date() : undefined,
      },
    });

    return UserConsentMapper.toEntity(consent);
  }
}
