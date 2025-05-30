import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CategoryService } from '../category.service';
import { CategoryNotOwnerException } from '../exceptions/category.exception';

@Injectable()
export class CategoryOwnerGuard implements CanActivate {
  constructor(private readonly categoryService: CategoryService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const categoryId = parseInt(request.params.id);

    // Check if we have both user and category ID
    if (!user || !categoryId) {
      return false;
    }

    // Get the category
    const category = await this.categoryService.findOne(categoryId);

    // If it's a global category (userId is null or undefined), allow access
    if (category.userId === null || category.userId === undefined) {
      return true;
    }

    // Check if the user owns the category
    if (category.userId !== user.id) {
      throw new CategoryNotOwnerException(categoryId);
    }

    return true;
  }
}
