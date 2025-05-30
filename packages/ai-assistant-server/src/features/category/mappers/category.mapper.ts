import { Category } from '@prisma/client';
import { ICategory } from '../interfaces/category.interface';
import { CategoryResponseDto } from '../dto/category-response.dto';

export class CategoryMapper {
  static toEntity(category: Category): ICategory {
    return {
      id: category.id,
      userId: category.userId ?? undefined,
      name: category.name,
      description: category.description ?? undefined,
      color: category.color ?? undefined,
      parentId: category.parentId ?? undefined,
      createdAt: category.createdAt,
    };
  }

  static toResponse(category: ICategory): CategoryResponseDto {
    return {
      id: category.id,
      userId: category.userId,
      name: category.name,
      description: category.description,
      color: category.color,
      parentId: category.parentId,
      createdAt: category.createdAt,
    };
  }
}
