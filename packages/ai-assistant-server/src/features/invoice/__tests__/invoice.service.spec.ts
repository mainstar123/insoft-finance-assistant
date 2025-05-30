import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/core/services';
import { InvoiceService } from '../invoice.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import {
  InvoiceNotFoundException,
  InvoiceAlreadyPaidException,
  InvoiceClosingDateException,
} from '../exceptions/invoice.exception';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      invoice: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    },
  };

  const mockInvoice = {
    id: 1,
    creditCardId: 1,
    invoiceDate: new Date('2024-01-01'),
    closingDate: new Date('2024-01-15'),
    amountCents: 100000,
    isArchived: false,
    isPaid: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create an invoice', async () => {
      const createDto: CreateInvoiceDto = {
        creditCardId: 1,
        invoiceDate: new Date('2024-01-01'),
        closingDate: new Date('2024-01-15'),
        amountCents: 100000,
        isArchived: false,
        isPaid: false,
      };

      mockPrismaService.client.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.creditCardId).toBe(createDto.creditCardId);
      expect(result.amountCents).toBe(createDto.amountCents);
    });

    it('should throw error if closing date is before invoice date', async () => {
      const createDto: CreateInvoiceDto = {
        creditCardId: 1,
        invoiceDate: new Date('2024-01-15'),
        closingDate: new Date('2024-01-01'), // Invalid: before invoice date
        amountCents: 100000,
        isArchived: false,
        isPaid: false,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        InvoiceClosingDateException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all non-archived invoices for a credit card', async () => {
      const invoices = [mockInvoice, { ...mockInvoice, id: 2 }];
      mockPrismaService.client.invoice.findMany.mockResolvedValue(invoices);

      const result = await service.findAll(1);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.client.invoice.findMany).toHaveBeenCalledWith({
        where: { creditCardId: 1, isArchived: false },
        orderBy: { invoiceDate: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an invoice by id', async () => {
      mockPrismaService.client.invoice.findUnique.mockResolvedValue(
        mockInvoice,
      );

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });

    it('should throw error if invoice not found', async () => {
      mockPrismaService.client.invoice.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        InvoiceNotFoundException,
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark invoice as paid', async () => {
      mockPrismaService.client.invoice.findUnique.mockResolvedValue(
        mockInvoice,
      );
      mockPrismaService.client.invoice.update.mockResolvedValue({
        ...mockInvoice,
        isPaid: true,
      });

      const result = await service.markAsPaid(1);

      expect(result.isPaid).toBe(true);
      expect(mockPrismaService.client.invoice.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isPaid: true },
      });
    });

    it('should throw error if invoice already paid', async () => {
      const paidInvoice = { ...mockInvoice, isPaid: true };
      mockPrismaService.client.invoice.findUnique.mockResolvedValue(
        paidInvoice,
      );

      await expect(service.markAsPaid(1)).rejects.toThrow(
        InvoiceAlreadyPaidException,
      );
    });
  });

  describe('archive', () => {
    it('should archive an invoice', async () => {
      mockPrismaService.client.invoice.findUnique.mockResolvedValue(
        mockInvoice,
      );
      mockPrismaService.client.invoice.update.mockResolvedValue({
        ...mockInvoice,
        isArchived: true,
      });

      await service.archive(1);

      expect(mockPrismaService.client.invoice.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isArchived: true },
      });
    });
  });
});
