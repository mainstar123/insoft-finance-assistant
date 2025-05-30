export interface IUserFeedback {
  id: number;
  userId?: number;
  answers: Record<string, any>;
  openComments?: string;
  submittedAt: Date;
}
