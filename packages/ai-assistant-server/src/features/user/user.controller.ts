import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserMapper } from './mappers/user.mapper';
import { UserNotFoundException } from './exceptions/user.exception';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UpdateUserConsentDto } from './dto/update-user-consent.dto';

@Controller('users')
@ApiTags('users')
@ApiResponse({ status: 500, description: 'Internal server error.' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userService.create(createUserDto);
    return UserMapper.toResponse(user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userService.findAll();
    return users.map((user) => UserMapper.toResponse(user as any));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findOne(+id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return UserMapper.toResponse(user as any);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ): Promise<UserResponseDto> {
    const user = await this.userService.update(+id, updateUserDto);
    return UserMapper.toResponse(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(+id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Find user by email' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByEmail(@Param('email') email: string): Promise<UserResponseDto> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return UserMapper.toResponse(user);
  }

  @Patch(':id/preferences')
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updatePreferences(
    @Param('id') id: string,
    @Body() updateUserPreferencesDto: UpdateUserPreferencesDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updatePreferences(
      +id,
      updateUserPreferencesDto,
    );
    return UserMapper.toResponse(user);
  }

  @Patch(':id/consent')
  @ApiOperation({ summary: 'Update user consent settings' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateConsent(
    @Param('id') id: string,
    @Body() updateUserConsentDto: UpdateUserConsentDto,
  ): Promise<UserResponseDto> {
    const user = await this.userService.updateConsent(
      +id,
      updateUserConsentDto,
    );
    return UserMapper.toResponse(user);
  }
}
