import { Invoice } from '@/core/integrations/database/types';
import { IInvoice } from '../interfaces/invoice.interface';
import { InvoiceResponseDto } from '../dto/invoice-response.dto';

export class InvoiceMapper {
  static toEntity(prismaInvoice: Invoice): IInvoice {
    return {
      id: prismaInvoice.id,
      creditCardId: prismaInvoice.creditCardId,
      invoiceDate: prismaInvoice.invoiceDate,
      closingDate: prismaInvoice.closingDate,
      amountCents: prismaInvoice.amountCents,
      isArchived: prismaInvoice.isArchived,
      isPaid: prismaInvoice.isPaid,
      createdAt: prismaInvoice.createdAt,
      updatedAt: prismaInvoice.updatedAt,
    };
  }

  static toResponse(invoice: IInvoice): InvoiceResponseDto {
    return new InvoiceResponseDto(invoice);
  }
}
