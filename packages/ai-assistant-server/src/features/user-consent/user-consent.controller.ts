import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserConsentService } from './user-consent.service';
import { CreateUserConsentDto } from './dto/create-user-consent.dto';
import { UserConsentResponseDto } from './dto/user-consent-response.dto';
import { UserConsentMapper } from './mappers/user-consent.mapper';
import { UserConsentOwnerGuard } from './guards/user-consent-owner.guard';

@ApiTags('user-consents')
@UseGuards(UserConsentOwnerGuard)
@Controller('user-consents')
export class UserConsentController {
  constructor(private readonly userConsentService: UserConsentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user consent' })
  async create(
    @Body() createDto: CreateUserConsentDto,
  ): Promise<UserConsentResponseDto> {
    const consent = await this.userConsentService.create(createDto);
    return UserConsentMapper.toResponse(consent);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all consents for a user' })
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserConsentResponseDto[]> {
    const consents = await this.userConsentService.findAll(userId);
    return consents.map(UserConsentMapper.toResponse);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update consent status' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body('status') status: boolean,
  ): Promise<UserConsentResponseDto> {
    const consent = await this.userConsentService.update(id, userId, status);
    return UserConsentMapper.toResponse(consent);
  }
}
