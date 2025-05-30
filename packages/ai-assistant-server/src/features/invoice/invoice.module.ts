import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceOwnerGuard } from './guards/invoice-owner.guard';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, InvoiceOwnerGuard],
  exports: [InvoiceService],
})
export class InvoiceModule {}
