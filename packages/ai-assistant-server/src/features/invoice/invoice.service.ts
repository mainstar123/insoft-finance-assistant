import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/services';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { IInvoice } from './interfaces/invoice.interface';
import { InvoiceMapper } from './mappers/invoice.mapper';
import {
  InvoiceNotFoundException,
  InvoiceAlreadyPaidException,
  InvoiceClosingDateException,
} from './exceptions/invoice.exception';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateInvoiceDto): Promise<IInvoice> {
    if (createDto.closingDate <= createDto.invoiceDate) {
      throw new InvoiceClosingDateException(
        'Closing date must be after invoice date',
      );
    }

    const invoice = await this.prisma.client.invoice.create({
      data: createDto,
    });

    return InvoiceMapper.toEntity(invoice);
  }

  async findAll(creditCardId: number): Promise<IInvoice[]> {
    const invoices = await this.prisma.client.invoice.findMany({
      where: {
        creditCardId,
        isArchived: false,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return invoices.map(InvoiceMapper.toEntity);
  }

  async findOne(id: number): Promise<IInvoice> {
    const invoice = await this.prisma.client.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new InvoiceNotFoundException(id);
    }

    return InvoiceMapper.toEntity(invoice);
  }

  async markAsPaid(id: number): Promise<IInvoice> {
    const invoice = await this.findOne(id);

    if (invoice.isPaid) {
      throw new InvoiceAlreadyPaidException(id);
    }

    const updatedInvoice = await this.prisma.client.invoice.update({
      where: { id },
      data: { isPaid: true },
    });

    return InvoiceMapper.toEntity(updatedInvoice);
  }

  async archive(id: number): Promise<void> {
    await this.findOne(id);

    await this.prisma.client.invoice.update({
      where: { id },
      data: { isArchived: true },
    });
  }
}
