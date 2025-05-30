export interface IInvoice {
  id: number;
  creditCardId: number;
  invoiceDate: Date;
  closingDate: Date;
  amountCents: number;
  isArchived: boolean;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}
