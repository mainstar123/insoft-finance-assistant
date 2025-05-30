import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ChatSessionService } from '../chat-session.service';

@Injectable()
export class ChatSessionOwnerGuard implements CanActivate {
  constructor(private chatSessionService: ChatSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const sessionId = request.params.id;

    if (!userId || !sessionId) return false;

    const session = await this.chatSessionService.findOne(+sessionId, +userId);
    return session.userId === userId;
  }
}
