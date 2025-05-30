import { ICategory } from '@/features/category/interfaces/category.interface';

export interface IBudget {
  id: number;
  userId: number;
  categoryId?: number | null;
  category?: ICategory | null;
  isGeneral: boolean;
  period: Date;
  amountCents: number;
  spentCents: number;
  remainingCents: number;
  isArchived: boolean;
  createdAt: Date;
}
