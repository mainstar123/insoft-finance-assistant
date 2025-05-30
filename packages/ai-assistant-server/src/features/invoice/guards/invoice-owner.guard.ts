import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '@/core/services';
import { InvoiceNotFoundException } from '../exceptions/invoice.exception';

@Injectable()
export class InvoiceOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const userId = request.user?.id;
      const invoiceId = request.params.id;
      const creditCardId = request.params.creditCardId;

      if (!userId) return false;

      // If accessing by credit card ID (for listing)
      if (creditCardId) {
        const creditCard = await this.prisma.client.creditCard.findUnique({
          where: { id: +creditCardId },
          select: { userId: true },
        });

        if (!creditCard) return false;
        return creditCard.userId === userId;
      }

      // If accessing specific invoice
      if (invoiceId) {
        const invoice = await this.prisma.client.invoice.findUnique({
          where: { id: +invoiceId },
          include: {
            creditCard: {
              select: { userId: true },
            },
          },
        });

        if (!invoice) throw new InvoiceNotFoundException(+invoiceId);
        return invoice.creditCard.userId === userId;
      }

      return false;
    } catch (error) {
      return false;
    }
  }
}
