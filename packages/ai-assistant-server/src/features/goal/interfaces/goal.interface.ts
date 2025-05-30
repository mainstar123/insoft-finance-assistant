export interface IGoal {
  id: number;
  userId: number;
  accountId?: number | null;
  name: string;
  description?: string;
  targetAmountCents: number;
  currentAmountCents: number;
  dueDate?: Date | null;
  achieved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
