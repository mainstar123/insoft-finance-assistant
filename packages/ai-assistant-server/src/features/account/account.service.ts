import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { IAccount } from './interfaces/account.interface';
import { AccountMapper } from './mappers/account.mapper';
import {
  AccountNotFoundException,
  DuplicateAccountException,
} from './exceptions/account.exception';
import { PrismaService } from '@/core/services';

@Injectable()
export class AccountService {
  private readonly prisma: PrismaClient;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService.client;
  }

  async create(createAccountDto: CreateAccountDto): Promise<IAccount> {
    const existingAccount = await this.prisma.account.findFirst({
      where: {
        userId: createAccountDto.userId,
        name: createAccountDto.name,
        isArchived: false,
      },
    });

    if (existingAccount) {
      throw new DuplicateAccountException(createAccountDto.name);
    }

    const account = await this.prisma.account.create({
      data: createAccountDto,
    });
    return AccountMapper.toEntity(account);
  }

  async findAll(userId: number): Promise<IAccount[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        userId,
        isArchived: false,
      },
    });
    return accounts.map(AccountMapper.toEntity);
  }

  async findOne(id: number, userId: number): Promise<IAccount> {
    const account = await this.prisma.account.findFirst({
      where: {
        id,
        userId,
        isArchived: false,
      },
    });

    if (!account) {
      throw new AccountNotFoundException(id);
    }

    return AccountMapper.toEntity(account);
  }

  async update(
    id: number,
    userId: number,
    updateData: Partial<CreateAccountDto>,
  ): Promise<IAccount> {
    await this.findOne(id, userId);

    const updatedAccount = await this.prisma.account.update({
      where: { id },
      data: updateData,
    });
    return AccountMapper.toEntity(updatedAccount);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.findOne(id, userId);

    await this.prisma.account.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async setDefault(id: number, userId: number): Promise<IAccount> {
    // First check if account exists
    await this.findOne(id, userId);

    // Unset any existing default account
    await this.prisma.account.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set the new default account
    const updatedAccount = await this.prisma.account.update({
      where: { id },
      data: { isDefault: true },
    });

    return AccountMapper.toEntity(updatedAccount);
  }
}
