import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/core/services';
import { CategoryService } from '../category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryNotFoundException } from '../exceptions/category.exception';
import { CategoryNotOwnerException } from '../exceptions/category.exception';

describe('CategoryService', () => {
  let service: CategoryService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    client: {
      category: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };

  const mockCategory = {
    id: 1,
    userId: 1,
    name: 'Test Category',
    description: 'Test Description',
    color: '#000000',
    parentId: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new root category', async () => {
      const createDto: CreateCategoryDto = {
        userId: 1,
        name: 'Food',
        description: 'Food expenses',
        color: '#FF0000',
      };

      mockPrismaService.client.category.create.mockResolvedValue({
        ...mockCategory,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.parentId).toBeUndefined();
      expect(mockPrismaService.client.category.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should create a subcategory', async () => {
      const parentCategory = {
        ...mockCategory,
        name: 'Food',
      };

      const createDto: CreateCategoryDto = {
        userId: 1,
        name: 'Restaurants',
        description: 'Restaurant expenses',
        color: '#00FF00',
        parentId: parentCategory.id,
      };

      const expectedSubcategory = {
        ...mockCategory,
        ...createDto,
        id: 2,
      };

      mockPrismaService.client.category.findUnique.mockResolvedValue(
        parentCategory,
      );
      mockPrismaService.client.category.create.mockResolvedValue(
        expectedSubcategory,
      );

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.parentId).toBe(parentCategory.id);
      expect(mockPrismaService.client.category.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should throw error when parent category does not exist', async () => {
      const createDto: CreateCategoryDto = {
        userId: 1,
        name: 'Restaurants',
        parentId: 999,
      };

      mockPrismaService.client.category.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        CategoryNotFoundException,
      );
    });

    it('should throw error when parent category belongs to different user', async () => {
      const parentCategory = {
        ...mockCategory,
        userId: 2,
      };

      const createDto: CreateCategoryDto = {
        userId: 1,
        name: 'Restaurants',
        parentId: parentCategory.id,
      };

      mockPrismaService.client.category.findUnique.mockResolvedValue(
        parentCategory,
      );

      await expect(service.create(createDto)).rejects.toThrow(
        CategoryNotOwnerException,
      );
    });

    it('should allow creating subcategory under global category', async () => {
      const globalParentCategory = {
        id: 1,
        userId: null,
        name: 'Global Category',
        description: 'Global Category Description',
        color: '#000000',
        parentId: null,
        createdAt: new Date(),
      };

      const createDto: CreateCategoryDto = {
        userId: 1,
        name: 'My Subcategory',
        description: 'My Subcategory Description',
        parentId: globalParentCategory.id,
      };

      mockPrismaService.client.category.findUnique.mockResolvedValue(
        globalParentCategory,
      );

      const expectedSubcategory = {
        id: 2,
        userId: 1,
        name: 'My Subcategory',
        description: 'My Subcategory Description',
        color: null,
        parentId: globalParentCategory.id,
        createdAt: new Date(),
      };

      mockPrismaService.client.category.create.mockResolvedValue(
        expectedSubcategory,
      );

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.parentId).toBe(globalParentCategory.id);
      expect(result.userId).toBe(createDto.userId);

      expect(mockPrismaService.client.category.findUnique).toHaveBeenCalledWith(
        {
          where: { id: globalParentCategory.id },
        },
      );
      expect(mockPrismaService.client.category.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it("should not allow creating subcategory under another user's category", async () => {
      const otherUserCategory = {
        ...mockCategory,
        userId: 2,
      };

      const createDto: CreateCategoryDto = {
        userId: 1,
        name: 'My Subcategory',
        parentId: otherUserCategory.id,
      };

      mockPrismaService.client.category.findUnique.mockResolvedValue(
        otherUserCategory,
      );

      await expect(service.create(createDto)).rejects.toThrow(
        CategoryNotOwnerException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all categories including global ones', async () => {
      const userId = 1;
      const categories = [
        mockCategory,
        { ...mockCategory, id: 2, userId: null },
      ];

      mockPrismaService.client.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.client.category.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userId }, { userId: null }],
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockPrismaService.client.category.findUnique.mockResolvedValue(
        mockCategory,
      );

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(mockPrismaService.client.category.findUnique).toHaveBeenCalledWith(
        {
          where: { id: 1 },
        },
      );
    });

    it('should throw CategoryNotFoundException when category not found', async () => {
      mockPrismaService.client.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        CategoryNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto = { name: 'Updated Category' };
      const existingCategory = { ...mockCategory };
      const updatedCategory = { ...mockCategory, ...updateDto };

      mockPrismaService.client.category.findUnique.mockResolvedValue(
        existingCategory,
      );

      mockPrismaService.client.category.update.mockResolvedValue(
        updatedCategory,
      );

      const result = await service.update(1, mockCategory.userId, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(mockPrismaService.client.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });

    it("should not allow updating another user's category", async () => {
      const otherUserCategory = {
        ...mockCategory,
        userId: 2,
      };

      mockPrismaService.client.category.findUnique.mockResolvedValue(
        otherUserCategory,
      );

      await expect(service.update(1, 1, { name: 'New Name' })).rejects.toThrow(
        CategoryNotOwnerException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      const existingCategory = { ...mockCategory };

      mockPrismaService.client.category.findUnique.mockResolvedValue(
        existingCategory,
      );

      mockPrismaService.client.category.delete.mockResolvedValue(
        existingCategory,
      );

      await service.remove(1, mockCategory.userId);

      expect(mockPrismaService.client.category.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should not allow deleting another user's category", async () => {
      const otherUserCategory = {
        ...mockCategory,
        userId: 2,
      };

      mockPrismaService.client.category.findUnique.mockResolvedValue(
        otherUserCategory,
      );

      await expect(service.remove(1, 1)).rejects.toThrow(
        CategoryNotOwnerException,
      );
    });
  });

  describe('findChildren', () => {
    it('should return immediate child categories', async () => {
      const parentId = 1;
      const childCategories = [
        { ...mockCategory, id: 2, name: 'Restaurants', parentId },
        { ...mockCategory, id: 3, name: 'Groceries', parentId },
      ];

      mockPrismaService.client.category.findMany.mockResolvedValue(
        childCategories,
      );

      const result = await service.findChildren(parentId);

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Restaurants');
      expect(result[1]?.name).toBe('Groceries');
      expect(mockPrismaService.client.category.findMany).toHaveBeenCalledWith({
        where: { parentId },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no children exist', async () => {
      mockPrismaService.client.category.findMany.mockResolvedValue([]);

      const result = await service.findChildren(1);

      expect(result).toHaveLength(0);
    });
  });

  describe('findGlobalCategories', () => {
    it('should return global categories', async () => {
      const globalCategories = [
        { ...mockCategory, userId: null },
        { ...mockCategory, id: 2, userId: null },
      ];

      mockPrismaService.client.category.findMany.mockResolvedValue(
        globalCategories,
      );

      const result = await service.findGlobalCategories();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.client.category.findMany).toHaveBeenCalledWith({
        where: { userId: null },
        orderBy: { name: 'asc' },
      });
    });
  });
});
