import { Module } from '@nestjs/common';
import { ChatSessionController } from './chat-session.controller';
import { ChatSessionService } from './chat-session.service';
import { ChatSessionOwnerGuard } from './guards/chat-session-owner.guard';

@Module({
  controllers: [ChatSessionController],
  providers: [ChatSessionService, ChatSessionOwnerGuard],
  exports: [ChatSessionService],
})
export class ChatSessionModule {}
