import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserFeedbackService } from './user-feedback.service';
import { CreateUserFeedbackDto } from './dto/create-user-feedback.dto';
import { UserFeedbackResponseDto } from './dto/user-feedback-response.dto';
import { UserFeedbackMapper } from './mappers/user-feedback.mapper';

@ApiTags('user-feedbacks')
@Controller('user-feedbacks')
export class UserFeedbackController {
  constructor(private readonly userFeedbackService: UserFeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user feedback' })
  async create(
    @Body() createDto: CreateUserFeedbackDto,
  ): Promise<UserFeedbackResponseDto> {
    const feedback = await this.userFeedbackService.create(createDto);
    return UserFeedbackMapper.toResponse(feedback);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all feedbacks for a user' })
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserFeedbackResponseDto[]> {
    const feedbacks = await this.userFeedbackService.findAll(userId);
    return feedbacks.map(UserFeedbackMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific feedback' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserFeedbackResponseDto> {
    const feedback = await this.userFeedbackService.findOne(id, userId);
    return UserFeedbackMapper.toResponse(feedback);
  }
}
