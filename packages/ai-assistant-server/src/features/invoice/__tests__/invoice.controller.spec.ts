import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceController } from '../invoice.controller';
import { InvoiceService } from '../invoice.service';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { InvoiceOwnerGuard } from '../guards/invoice-owner.guard';

jest.mock('../guards/invoice-owner.guard', () => ({
  InvoiceOwnerGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let service: InvoiceService;

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
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockInvoice),
            findAll: jest.fn().mockResolvedValue([mockInvoice]),
            findOne: jest.fn().mockResolvedValue(mockInvoice),
            markAsPaid: jest
              .fn()
              .mockResolvedValue({ ...mockInvoice, isPaid: true }),
            archive: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<InvoiceController>(InvoiceController);
    service = module.get<InvoiceService>(InvoiceService);
  });

  it('should create an invoice', async () => {
    const createDto: CreateInvoiceDto = {
      creditCardId: 1,
      invoiceDate: new Date('2024-01-01'),
      closingDate: new Date('2024-01-15'),
      amountCents: 100000,
      isArchived: false,
      isPaid: false,
    };

    const result = await controller.create(createDto);
    expect(result).toEqual(mockInvoice);
    expect(service.create).toHaveBeenCalledWith(createDto);
  });

  it('should return all invoices for a credit card', async () => {
    const result = await controller.findAll(1);
    expect(result).toHaveLength(1);
    expect(service.findAll).toHaveBeenCalledWith(1);
  });

  it('should return an invoice by id', async () => {
    const result = await controller.findOne(1);
    expect(result).toEqual(mockInvoice);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should mark invoice as paid', async () => {
    const result = await controller.markAsPaid(1);
    expect(result.isPaid).toBe(true);
    expect(service.markAsPaid).toHaveBeenCalledWith(1);
  });

  it('should archive an invoice', async () => {
    await controller.archive(1);
    expect(service.archive).toHaveBeenCalledWith(1);
  });
});
