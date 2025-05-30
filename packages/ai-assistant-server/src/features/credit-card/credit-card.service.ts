import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { CreditCard } from '@prisma/client';
import { PrismaService } from '@/core/services/prisma.service';

@Injectable()
export class CreditCardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCreditCardDto): Promise<CreditCard> {
    return this.prisma.client.creditCard.create({
      data: {
        ...createDto,
        limitPercentage: 0,
        currentDebtCents: 0,
      },
    });
  }

  async findAll(userId: number): Promise<CreditCard[]> {
    return this.prisma.client.creditCard.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<CreditCard> {
    const creditCard = await this.prisma.client.creditCard.findUnique({
      where: { id },
    });

    if (!creditCard) {
      throw new NotFoundException(`Credit card with ID ${id} not found`);
    }

    return creditCard;
  }

  async update(
    id: number,
    updateData: Partial<CreditCard>,
  ): Promise<CreditCard> {
    return this.prisma.client.creditCard.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number): Promise<CreditCard> {
    return this.prisma.client.creditCard.update({
      where: { id },
      data: { isArchived: true },
    });
  }
}
