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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoryMapper } from './mappers/category.mapper';
import { CategoryOwnerGuard } from './guards/category-owner.guard';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ type: CategoryResponseDto })
  async create(
    @Body() createDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.create(createDto);
    return CategoryMapper.toResponse(category);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all categories for a user' })
  @ApiResponse({ type: [CategoryResponseDto] })
  async findAll(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findAll(userId);
    return categories.map(CategoryMapper.toResponse);
  }

  @Get(':id')
  @UseGuards(CategoryOwnerGuard)
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ type: CategoryResponseDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.findOne(id);
    return CategoryMapper.toResponse(category);
  }

  @Put(':id')
  @UseGuards(CategoryOwnerGuard)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ type: CategoryResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: Partial<CreateCategoryDto>,
    @Request() req: any,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.update(
      id,
      req.user.id,
      updateDto,
    );
    return CategoryMapper.toResponse(category);
  }

  @Delete(':id')
  @UseGuards(CategoryOwnerGuard)
  @ApiOperation({ summary: 'Delete a category' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<void> {
    await this.categoryService.remove(id, req.user.id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get all child categories' })
  @ApiResponse({ type: [CategoryResponseDto] })
  async findChildren(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findChildren(id);
    return categories.map(CategoryMapper.toResponse);
  }

  @Get('global')
  @ApiOperation({ summary: 'Get all global categories' })
  @ApiResponse({ type: [CategoryResponseDto] })
  async findGlobalCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findGlobalCategories();
    return categories.map(CategoryMapper.toResponse);
  }
}
