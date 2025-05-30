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
import { GoalService } from './goal.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalResponseDto } from './dto/goal-response.dto';
import { GoalMapper } from './mappers/goal.mapper';
import { GoalOwnerGuard } from './guards/goal-owner.guard';

@ApiTags('goals')
@UseGuards(GoalOwnerGuard)
@Controller('goals')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new financial goal' })
  async create(@Body() createDto: CreateGoalDto): Promise<GoalResponseDto> {
    const goal = await this.goalService.create(createDto);
    return GoalMapper.toResponse(goal);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all goals for a user' })
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<GoalResponseDto[]> {
    const goals = await this.goalService.findAll(userId);
    return goals.map(GoalMapper.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a goal by ID' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GoalResponseDto> {
    const goal = await this.goalService.findOne(id);
    return GoalMapper.toResponse(goal);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Update goal progress' })
  async updateProgress(
    @Param('id', ParseIntPipe) id: number,
    @Body('currentAmountCents') currentAmountCents: number,
  ): Promise<GoalResponseDto> {
    const goal = await this.goalService.updateProgress(id, currentAmountCents);
    return GoalMapper.toResponse(goal);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a goal' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.goalService.remove(id);
  }
}
