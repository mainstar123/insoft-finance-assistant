import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/services';
import { CreateGoalDto } from './dto/create-goal.dto';
import { IGoal } from './interfaces/goal.interface';
import { GoalMapper } from './mappers/goal.mapper';
import {
  GoalNotFoundException,
  GoalNotOwnerException,
  InvalidGoalProgressException,
} from './exceptions/goal.exception';

@Injectable()
export class GoalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateGoalDto): Promise<IGoal> {
    const goal = await this.prisma.client.goal.create({
      data: createDto,
    });

    return GoalMapper.toEntity(goal);
  }

  async findAll(userId: number): Promise<IGoal[]> {
    const goals = await this.prisma.client.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map(GoalMapper.toEntity);
  }

  async findOne(id: number): Promise<IGoal> {
    const goal = await this.prisma.client.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      throw new GoalNotFoundException(id);
    }

    return GoalMapper.toEntity(goal);
  }

  async update(
    id: number,
    userId: number,
    updateDto: Partial<CreateGoalDto>,
  ): Promise<IGoal> {
    const goal = await this.findOne(id);

    if (goal.userId !== userId) {
      throw new GoalNotOwnerException(id);
    }

    const updatedGoal = await this.prisma.client.goal.update({
      where: { id },
      data: updateDto,
    });

    return GoalMapper.toEntity(updatedGoal);
  }

  async updateProgress(id: number, currentAmountCents: number): Promise<IGoal> {
    const goal = await this.findOne(id);

    if (currentAmountCents < 0) {
      throw new InvalidGoalProgressException(
        'Current amount cannot be negative',
      );
    }

    if (currentAmountCents > goal.targetAmountCents) {
      throw new InvalidGoalProgressException(
        'Current amount cannot exceed target amount',
      );
    }

    const achieved = currentAmountCents >= goal.targetAmountCents;

    const updatedGoal = await this.prisma.client.goal.update({
      where: { id },
      data: {
        currentAmountCents,
        achieved,
      },
    });

    return GoalMapper.toEntity(updatedGoal);
  }

  async remove(id: number): Promise<void> {
    const goal = await this.findOne(id);

    if (goal.achieved) {
      throw new InvalidGoalProgressException('Cannot delete an achieved goal');
    }

    await this.prisma.client.goal.delete({
      where: { id },
    });
  }
}
