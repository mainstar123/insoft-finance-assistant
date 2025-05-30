import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { CreditCardService } from '../credit-card.service';

@Injectable()
export class CreditCardOwnerGuard implements CanActivate {
  constructor(private readonly creditCardService: CreditCardService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const creditCardId = request.params.id;

    if (!userId || !creditCardId) return false;

    const creditCard = await this.creditCardService.findOne(+creditCardId);
    return creditCard.userId === userId;
  }
}
