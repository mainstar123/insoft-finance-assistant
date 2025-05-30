import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseArrayPipe,
	ParseIntPipe,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryTransactionDto } from './dto/category-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionOwnerGuard } from './guards/transaction-owner.guard';
import { TransactionMapper } from './mappers/transaction.mapper';
import { TransactionService } from './transaction.service';

@ApiTags('transactions')
@UseGuards(TransactionOwnerGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  async create(
    @Body() createDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionService.create(createDto);
    return TransactionMapper.toResponse(transaction);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get all transactions for a user' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<TransactionResponseDto[]> {
    const transactions = await this.transactionService.findAll({ userId });
    return transactions.map(TransactionMapper.toResponse);
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get all transactions for an account' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async findByAccount(
    @Param('accountId', ParseIntPipe) accountId: number,
  ): Promise<TransactionResponseDto[]> {
    const transactions = await this.transactionService.findByAccount(accountId);
    return transactions.map(TransactionMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionService.findOne(id);
    return TransactionMapper.toResponse(transaction);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateTransactionDto>,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionService.update(id, updateDto);
    return TransactionMapper.toResponse(transaction);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.transactionService.remove(id);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get transactions by category' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async findByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ): Promise<TransactionResponseDto[]> {
    const transactions =
      await this.transactionService.findByCategory(categoryId);
    return transactions.map(TransactionMapper.toResponse);
  }

  @Get('date-range')
  @ApiOperation({ summary: 'Get transactions within a date range' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async findByDateRange(
    @Body('startDate') startDate: Date,
    @Body('endDate') endDate: Date,
    @Body('userId', ParseIntPipe) userId: number,
  ): Promise<TransactionResponseDto[]> {
    const transactions = await this.transactionService.findByDateRange(
      userId,
      startDate,
      endDate,
    );
    return transactions.map(TransactionMapper.toResponse);
  }

  @Put(':id/category')
  @ApiOperation({ summary: 'Update transaction category' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() categoryDto: CategoryTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionService.updateCategory(
      id,
      categoryDto,
    );
    return TransactionMapper.toResponse(transaction);
  }

  @Get('uncategorized/:userId')
  @ApiOperation({ summary: 'Get uncategorized transactions' })
  @ApiResponse({ status: 200, type: [TransactionResponseDto] })
  async findUncategorized(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<TransactionResponseDto[]> {
    const transactions =
      await this.transactionService.findUncategorized(userId);
    return transactions.map(TransactionMapper.toResponse);
  }

  @Post('bulk-category')
  @ApiOperation({ summary: 'Update categories for multiple transactions' })
  async bulkUpdateCategories(
    @Body('transactionIds', new ParseArrayPipe({ items: Number }))
    transactionIds: number[],
    @Body('category') categoryDto: CategoryTransactionDto,
  ): Promise<void> {
    await this.transactionService.bulkUpdateCategories(
      transactionIds,
      categoryDto,
    );
  }

  @Get('category-stats/:categoryId')
  @ApiOperation({ summary: 'Get category statistics' })
  async getCategoryStats(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('userId', ParseIntPipe) userId: number,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
  ) {
    return this.transactionService.getCategoryStats(userId, categoryId, {
      startDate,
      endDate,
    });
  }
}
