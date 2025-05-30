import { UserFeedback } from '@prisma/client';
import { IUserFeedback } from '../interfaces/user-feedback.interface';
import { UserFeedbackResponseDto } from '../dto/user-feedback-response.dto';

export class UserFeedbackMapper {
  static toEntity(prismaFeedback: UserFeedback): IUserFeedback {
    return {
      id: prismaFeedback.id,
      userId: prismaFeedback.userId || undefined,
      answers: prismaFeedback.answers as Record<string, any>,
      openComments: prismaFeedback.openComments || undefined,
      submittedAt: prismaFeedback.submittedAt,
    };
  }

  static toResponse(feedback: IUserFeedback): UserFeedbackResponseDto {
    return new UserFeedbackResponseDto(feedback);
  }
}
