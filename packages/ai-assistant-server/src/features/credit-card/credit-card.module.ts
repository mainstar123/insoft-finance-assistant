import { Module } from '@nestjs/common';
import { CreditCardController } from './credit-card.controller';
import { CreditCardService } from './credit-card.service';
import { PrismaService } from '@/core/services/prisma.service';
import { CreditCardOwnerGuard } from './guards/credit-card-owner.guard';

@Module({
  controllers: [CreditCardController],
  providers: [CreditCardService, CreditCardOwnerGuard, PrismaService],
  exports: [CreditCardService],
})
export class CreditCardModule {}
