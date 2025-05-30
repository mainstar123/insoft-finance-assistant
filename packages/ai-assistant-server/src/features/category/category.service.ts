import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/services';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ICategory } from './interfaces/category.interface';
import { CategoryMapper } from './mappers/category.mapper';
import {
  CategoryNotFoundException,
  CategoryNotOwnerException,
} from './exceptions/category.exception';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCategoryDto): Promise<ICategory> {
    if (createDto.parentId) {
      const parentCategory = await this.findOne(createDto.parentId);

      // Allow creating subcategories under global categories (userId is null)
      // or if user owns the parent category
      if (
        parentCategory.userId !== undefined &&
        parentCategory.userId !== createDto.userId
      ) {
        throw new CategoryNotOwnerException(createDto.parentId);
      }
    }

    const category = await this.prisma.client.category.create({
      data: createDto,
    });

    return CategoryMapper.toEntity(category);
  }

  async findAll(userId: number): Promise<ICategory[]> {
    const categories = await this.prisma.client.category.findMany({
      where: {
        OR: [
          { userId },
          { userId: null }, // Include global categories
        ],
      },
      orderBy: { name: 'asc' },
    });

    return categories.map(CategoryMapper.toEntity);
  }

  async findOne(id: number): Promise<ICategory> {
    const category = await this.prisma.client.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new CategoryNotFoundException(id);
    }

    return CategoryMapper.toEntity(category);
  }

  async update(
    id: number,
    userId: number,
    updateDto: Partial<CreateCategoryDto>,
  ): Promise<ICategory> {
    const category = await this.findOne(id);

    // Only owner can update their categories
    if (category.userId !== userId) {
      throw new CategoryNotOwnerException(id);
    }

    const updatedCategory = await this.prisma.client.category.update({
      where: { id },
      data: updateDto,
    });

    return CategoryMapper.toEntity(updatedCategory);
  }

  async remove(id: number, userId: number): Promise<void> {
    const category = await this.findOne(id);

    // Only owner can delete their categories
    if (category.userId !== userId) {
      throw new CategoryNotOwnerException(id);
    }

    await this.prisma.client.category.delete({
      where: { id },
    });
  }

  async findChildren(parentId: number): Promise<ICategory[]> {
    const categories = await this.prisma.client.category.findMany({
      where: { parentId },
      orderBy: { name: 'asc' },
    });

    return categories.map(CategoryMapper.toEntity);
  }

  async findGlobalCategories(): Promise<ICategory[]> {
    const categories = await this.prisma.client.category.findMany({
      where: {
        userId: null,
      },
      orderBy: { name: 'asc' },
    });

    return categories.map(CategoryMapper.toEntity);
  }
}
