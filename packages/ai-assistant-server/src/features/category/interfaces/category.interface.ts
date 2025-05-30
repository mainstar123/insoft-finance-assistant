export interface ICategory {
  id: number;
  userId?: number;
  name: string;
  description?: string;
  color?: string;
  parentId?: number;
  createdAt: Date;
}
