import { Module } from '@nestjs/common';
import { UserFeedbackController } from './user-feedback.controller';
import { UserFeedbackService } from './user-feedback.service';

@Module({
  controllers: [UserFeedbackController],
  providers: [UserFeedbackService],
  exports: [UserFeedbackService],
})
export class UserFeedbackModule {}
