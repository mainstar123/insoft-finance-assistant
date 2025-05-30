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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreditCardService } from './credit-card.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { CreditCardResponseDto } from './dto/credit-card-response.dto';
import { CreditCardMapper } from './mappers/credit-card.mapper';
import { CreditCardOwnerGuard } from './guards/credit-card-owner.guard';

@ApiTags('credit-cards')
@UseGuards(CreditCardOwnerGuard)
@Controller('credit-cards')
export class CreditCardController {
  constructor(private readonly creditCardService: CreditCardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new credit card' })
  @ApiResponse({ type: CreditCardResponseDto })
  async create(
    @Body() createDto: CreateCreditCardDto,
  ): Promise<CreditCardResponseDto> {
    const creditCard = await this.creditCardService.create(createDto);
    return CreditCardMapper.toResponse(creditCard);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all credit cards for a user' })
  @ApiResponse({ type: [CreditCardResponseDto] })
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<CreditCardResponseDto[]> {
    const creditCards = await this.creditCardService.findAll(userId);
    return creditCards.map(CreditCardMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a credit card by ID' })
  @ApiResponse({ type: CreditCardResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CreditCardResponseDto> {
    const creditCard = await this.creditCardService.findOne(id);
    return CreditCardMapper.toResponse(creditCard);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a credit card' })
  @ApiResponse({ type: CreditCardResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: Partial<CreateCreditCardDto>,
  ): Promise<CreditCardResponseDto> {
    const creditCard = await this.creditCardService.update(id, updateData);
    return CreditCardMapper.toResponse(creditCard);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a credit card' })
  @ApiResponse({ type: CreditCardResponseDto })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CreditCardResponseDto> {
    const creditCard = await this.creditCardService.remove(id);
    return CreditCardMapper.toResponse(creditCard);
  }
}
