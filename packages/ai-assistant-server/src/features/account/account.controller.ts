import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { AccountResponseDto } from './dto/account-response.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountMapper } from './mappers/account.mapper';
import { AccountOwnerGuard } from './guards/account-owner.guard';

@ApiTags('accounts')
@ApiResponse({ status: 403, description: 'Forbidden.' })
@ApiResponse({ status: 500, description: 'Internal server error.' })
@UseGuards(AccountOwnerGuard)
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new account',
    description: 'Creates a new financial account for the user',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully.',
    type: AccountResponseDto,
  })
  async create(
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.accountService.create(createAccountDto);
    return AccountMapper.toResponse(account);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get all accounts for a user',
    description:
      'Retrieves all financial accounts associated with a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of accounts retrieved successfully.',
    type: [AccountResponseDto],
  })
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<AccountResponseDto[]> {
    const accounts = await this.accountService.findAll(userId);
    return accounts.map(AccountMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an account by ID',
    description:
      'Retrieves a specific financial account by its unique identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Account retrieved successfully.',
    type: AccountResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<AccountResponseDto> {
    const userId = req.user.id;
    const account = await this.accountService.findOne(id, userId);
    return AccountMapper.toResponse(account);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update an account',
    description: 'Updates the details of a financial account',
  })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully.',
    type: AccountResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateAccountDto: Partial<CreateAccountDto>,
  ): Promise<AccountResponseDto> {
    const account = await this.accountService.update(
      id,
      userId,
      updateAccountDto,
    );
    return AccountMapper.toResponse(account);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive an account',
    description:
      'Archives a financial account by setting its isArchived flag to true',
  })
  @ApiResponse({
    status: 200,
    description: 'Account archived successfully.',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    return this.accountService.remove(id, userId);
  }

  @Put(':id/set-default')
  @ApiOperation({
    summary: 'Set account as default',
    description: 'Sets a financial account as the default account for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Account set as default successfully.',
    type: AccountResponseDto,
  })
  async setDefault(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<AccountResponseDto> {
    const account = await this.accountService.setDefault(id, userId);
    return new AccountResponseDto(account);
  }
}
