import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from '../category.controller';
import { CategoryService } from '../category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';

describe('CategoryController', () => {
  let controller: CategoryController;
  let service: CategoryService;

  const mockCategory = {
    id: 1,
    userId: 1,
    name: 'Test Category',
    description: 'Test Description',
    color: '#000000',
    parentId: null,
    createdAt: new Date(),
  };

  const mockCategoryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findChildren: jest.fn(),
    findGlobalCategories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a root category', async () => {
      const createDto: CreateCategoryDto = {
        userId: 1,
        name: 'Food',
        description: 'Food expenses',
        color: '#FF0000',
      };

      const expectedCategory = {
        ...mockCategory,
        ...createDto,
        parentId: undefined,
      };

      mockCategoryService.create.mockResolvedValue(expectedCategory);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.parentId).toBeUndefined();
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should create a subcategory', async () => {
      const createDto: CreateCategoryDto = {
        userId: 1,
        name: 'Restaurants',
        description: 'Restaurant expenses',
        color: '#00FF00',
        parentId: 1,
      };

      const expectedCategory = {
        ...mockCategory,
        ...createDto,
        id: 2,
      };

      mockCategoryService.create.mockResolvedValue(expectedCategory);

      const result = await controller.create(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.parentId).toBe(createDto.parentId);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all categories for a user', async () => {
      mockCategoryService.findAll.mockResolvedValue([mockCategory]);

      const result = await controller.findAll(1);

      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      mockCategoryService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne(1);

      expect(result).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto = { name: 'Updated Category' };
      const updatedCategory = { ...mockCategory, ...updateDto };

      mockCategoryService.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(1, updateDto, { user: { id: 1 } });

      expect(result.name).toBe(updateDto.name);
      expect(service.update).toHaveBeenCalledWith(1, 1, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      await controller.remove(1, { user: { id: 1 } });

      expect(service.remove).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('findChildren', () => {
    it('should return child categories ordered by name', async () => {
      const childCategories = [
        { ...mockCategory, id: 2, name: 'Restaurants', parentId: 1 },
        { ...mockCategory, id: 3, name: 'Groceries', parentId: 1 },
      ];

      mockCategoryService.findChildren.mockResolvedValue(childCategories);

      const result = await controller.findChildren(1);

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Restaurants');
      expect(result[1]?.name).toBe('Groceries');
      expect(service.findChildren).toHaveBeenCalledWith(1);
    });

    it('should return empty array when no children exist', async () => {
      mockCategoryService.findChildren.mockResolvedValue([]);

      const result = await controller.findChildren(1);

      expect(result).toHaveLength(0);
      expect(service.findChildren).toHaveBeenCalledWith(1);
    });
  });

  describe('findGlobalCategories', () => {
    it('should return global categories', async () => {
      const globalCategories = [
        { ...mockCategory, userId: null },
        { ...mockCategory, id: 2, userId: null },
      ];

      mockCategoryService.findGlobalCategories.mockResolvedValue(
        globalCategories,
      );

      const result = await controller.findGlobalCategories();

      expect(result).toHaveLength(2);
      expect(service.findGlobalCategories).toHaveBeenCalled();
    });
  });
});
