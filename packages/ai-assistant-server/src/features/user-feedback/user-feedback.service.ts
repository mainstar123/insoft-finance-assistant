import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@/core/services';
import { CreateUserFeedbackDto } from './dto/create-user-feedback.dto';
import { IUserFeedback } from './interfaces/user-feedback.interface';
import { UserFeedbackMapper } from './mappers/user-feedback.mapper';
import { UserFeedbackNotFoundException } from './exceptions/user-feedback.exception';

@Injectable()
export class UserFeedbackService {
  private readonly prisma: PrismaClient;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService.client;
  }

  async create(createDto: CreateUserFeedbackDto): Promise<IUserFeedback> {
    const feedback = await this.prisma.userFeedback.create({
      data: createDto,
    });
    return UserFeedbackMapper.toEntity(feedback);
  }

  async findAll(userId: number): Promise<IUserFeedback[]> {
    const feedbacks = await this.prisma.userFeedback.findMany({
      where: { userId },
    });
    return feedbacks.map(UserFeedbackMapper.toEntity);
  }

  async findOne(id: number, userId: number): Promise<IUserFeedback> {
    const feedback = await this.prisma.userFeedback.findFirst({
      where: { id, userId },
    });

    if (!feedback) {
      throw new UserFeedbackNotFoundException(id);
    }

    return UserFeedbackMapper.toEntity(feedback);
  }
}
