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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { BudgetMapper } from './mappers/budget.mapper';
import { BudgetOwnerGuard } from './guards/budget-owner.guard';

@ApiTags('budgets')
@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new budget' })
  @ApiResponse({ type: BudgetResponseDto })
  async create(@Body() createDto: CreateBudgetDto): Promise<BudgetResponseDto> {
    const budget = await this.budgetService.create(createDto);
    return BudgetMapper.toResponse(budget);
  }

  @Get()
  @UseGuards(BudgetOwnerGuard)
  @ApiOperation({ summary: 'Get all budgets for the authenticated user' })
  @ApiResponse({ type: [BudgetResponseDto] })
  async findAll(@Request() req: any): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetService.findAll(req.user.id);
    return budgets.map(BudgetMapper.toResponse);
  }

  @Get(':id')
  @UseGuards(BudgetOwnerGuard)
  @ApiOperation({ summary: 'Get a budget by ID' })
  @ApiResponse({ type: BudgetResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetService.findOne(id);
    return BudgetMapper.toResponse(budget);
  }

  @Put(':id')
  @UseGuards(BudgetOwnerGuard)
  @ApiOperation({ summary: 'Update a budget' })
  @ApiResponse({ type: BudgetResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateBudgetDto>,
    @Request() req: any,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetService.update(id, req.user.id, updateDto);
    return BudgetMapper.toResponse(budget);
  }

  @Delete(':id')
  @UseGuards(BudgetOwnerGuard)
  @ApiOperation({ summary: 'Archive a budget' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    await this.budgetService.remove(id, req.user.id);
  }

  @Get('period/:date')
  @UseGuards(BudgetOwnerGuard)
  @ApiOperation({ summary: 'Get budgets for a specific period' })
  @ApiResponse({ type: [BudgetResponseDto] })
  async findByPeriod(
    @Param('date') date: string,
    @Request() req: any,
  ): Promise<BudgetResponseDto[]> {
    const period = new Date(date);
    const budgets = await this.budgetService.findByPeriod(req.user.id, period);
    return budgets.map(BudgetMapper.toResponse);
  }
}
