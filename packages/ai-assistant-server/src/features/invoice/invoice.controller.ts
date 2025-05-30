import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { InvoiceMapper } from './mappers/invoice.mapper';
import { InvoiceOwnerGuard } from './guards/invoice-owner.guard';

@ApiTags('invoices')
@ApiResponse({ status: 403, description: 'Forbidden.' })
@ApiResponse({ status: 500, description: 'Internal server error.' })
@UseGuards(InvoiceOwnerGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new invoice',
    description: 'Creates a new invoice for a credit card',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully.',
    type: InvoiceResponseDto,
  })
  async create(
    @Body() createDto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceService.create(createDto);
    return InvoiceMapper.toResponse(invoice);
  }

  @Get('credit-card/:creditCardId')
  @ApiOperation({
    summary: 'Get all invoices for a credit card',
    description:
      'Retrieves all invoices associated with a specific credit card',
  })
  @ApiResponse({
    status: 200,
    description: 'List of invoices retrieved successfully.',
    type: [InvoiceResponseDto],
  })
  async findAll(
    @Param('creditCardId', ParseIntPipe) creditCardId: number,
  ): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoiceService.findAll(creditCardId);
    return invoices.map(InvoiceMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an invoice by ID',
    description: 'Retrieves a specific invoice by its unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved successfully.',
    type: InvoiceResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceService.findOne(id);
    return InvoiceMapper.toResponse(invoice);
  }

  @Put(':id/pay')
  @ApiOperation({
    summary: 'Mark invoice as paid',
    description: 'Marks a specific invoice as paid',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice marked as paid successfully.',
    type: InvoiceResponseDto,
  })
  async markAsPaid(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceService.markAsPaid(id);
    return InvoiceMapper.toResponse(invoice);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive an invoice',
    description: 'Archives an invoice by setting its isArchived flag to true',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice archived successfully.',
  })
  async archive(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.invoiceService.archive(id);
  }
}
