export interface IUserConsent {
  id: number;
  userId: number;
  type: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}
