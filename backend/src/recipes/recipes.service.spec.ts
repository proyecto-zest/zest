import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import {
  IngredientUnit,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  DEFAULT_RECIPE_AUTHOR_ID,
  MAX_RECIPES_LIMIT,
} from './recipes.constants';
import { RecipesService } from './recipes.service';

type RecipeCreateArguments = {
  data: {
    authorId: string;
    images: { create: { s3Key: string } };
    ingredients: { create: CreateRecipeDto['ingredients'] };
    steps: { create: Array<{ stepNumber: number; text: string }> };
  };
};

describe('RecipesService', () => {
  const tomatoId = '11111111-1111-4111-8111-111111111111';
  const oilId = '22222222-2222-4222-8222-222222222222';
  const recipeId = '33333333-3333-4333-8333-333333333333';
  const imageKey = 'recipes/image.webp';
  const signedUrl = (key: string): string => `https://signed.test/${key}`;
  const createRecipeDto: CreateRecipeDto = {
    title: 'Ensalada de tomate',
    description: 'Una ensalada fresca.',
    category: RecipeCategory.ENTRADA,
    time: 10,
    timeUnit: RecipeTimeUnit.MINUTOS,
    difficulty: RecipeDifficulty.FACIL,
    servings: 2,
    imageKey,
    ingredients: [
      { ingredientId: tomatoId, amount: '2', unit: IngredientUnit.UNIDAD },
      { ingredientId: oilId, amount: '1', unit: IngredientUnit.CUCHARADA },
    ],
    steps: ['Cortar el tomate.', 'Mezclar los ingredientes.'],
  };

  const recipeRecord = (imageKeys: string[] = [imageKey]) => ({
    id: recipeId,
    authorId: DEFAULT_RECIPE_AUTHOR_ID,
    title: createRecipeDto.title,
    description: createRecipeDto.description,
    category: createRecipeDto.category,
    time: createRecipeDto.time,
    timeUnit: createRecipeDto.timeUnit,
    difficulty: createRecipeDto.difficulty,
    servings: createRecipeDto.servings,
    ingredients: [
      {
        recipeId,
        ingredientId: tomatoId,
        amount: '2',
        unit: IngredientUnit.UNIDAD,
        ingredient: { id: tomatoId, name: 'Tomate' },
      },
    ],
    steps: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        recipeId,
        stepNumber: 1,
        text: 'Cortar el tomate.',
      },
    ],
    images: imageKeys.map((s3Key) => ({ s3Key })),
  });

  const ingredientFindMany = jest.fn<
    Promise<Array<{ id: string }>>,
    [unknown]
  >();
  const recipeCreate = jest.fn<Promise<unknown>, [unknown]>();
  const recipeCount = jest.fn<Promise<number>, [unknown]>();
  const recipeFindMany = jest.fn<
    Promise<Array<Record<string, unknown>>>,
    [unknown]
  >();
  const recipeFindUnique = jest.fn<
    Promise<Record<string, unknown> | null>,
    [unknown]
  >();
  const recipeUpdate = jest.fn<Promise<Record<string, unknown>>, [unknown]>();
  const recipeDelete = jest.fn<Promise<unknown>, [unknown]>();
  const recipeIngredientDeleteMany = jest.fn<Promise<unknown>, [unknown]>();
  const recipeStepDeleteMany = jest.fn<Promise<unknown>, [unknown]>();
  const recipeImageDeleteMany = jest.fn<Promise<unknown>, [unknown]>();
  const runTransaction = jest.fn<
    Promise<unknown>,
    [(transaction: unknown) => Promise<unknown>]
  >();
  const objectExists = jest.fn<Promise<boolean>, [string]>();
  const deleteObject = jest.fn<Promise<void>, [string]>();
  const getSignedReadUrl = jest.fn<Promise<string>, [string]>();
  let service: RecipesService;

  beforeEach(() => {
    jest.clearAllMocks();
    runTransaction.mockImplementation(
      async (operation: (transaction: unknown) => Promise<unknown>) =>
        operation({
          ingredient: { findMany: ingredientFindMany },
          recipe: { create: recipeCreate, delete: recipeDelete },
          recipeIngredient: { deleteMany: recipeIngredientDeleteMany },
          recipeStep: { deleteMany: recipeStepDeleteMany },
          recipeImage: { deleteMany: recipeImageDeleteMany },
        }),
    );
    objectExists.mockResolvedValue(true);
    deleteObject.mockResolvedValue(undefined);
    getSignedReadUrl.mockImplementation((key: string) =>
      Promise.resolve(signedUrl(key)),
    );

    service = new RecipesService(
      {
        $transaction: runTransaction,
        recipe: {
          count: recipeCount,
          findMany: recipeFindMany,
          findUnique: recipeFindUnique,
          update: recipeUpdate,
        },
      } as unknown as PrismaService,
      {
        objectExists,
        deleteObject,
        getSignedReadUrl,
      } as unknown as StorageService,
    );
  });

  it('returns recipe detail with signed image URLs', async () => {
    recipeFindUnique.mockResolvedValue(
      recipeRecord([imageKey, 'recipes/secondary.webp']),
    );

    const recipe = await service.findOne(recipeId);

    expect(recipe.imageUrls).toEqual([
      signedUrl(imageKey),
      signedUrl('recipes/secondary.webp'),
    ]);
    expect(recipe).not.toHaveProperty('images');
    expect(recipeFindUnique).toHaveBeenCalledWith({
      where: { id: recipeId },
      include: {
        ingredients: { include: { ingredient: true } },
        steps: { orderBy: { stepNumber: 'asc' } },
        images: { select: { s3Key: true } },
      },
    });
  });

  it('does not invent a default image when a recipe has no images', async () => {
    recipeFindUnique.mockResolvedValue(recipeRecord([]));

    await expect(service.findOne(recipeId)).resolves.toMatchObject({
      imageUrls: [],
    });
    expect(getSignedReadUrl).not.toHaveBeenCalled();
  });

  it('throws not found when the recipe does not exist', async () => {
    recipeFindUnique.mockResolvedValue(null);

    await expect(service.findOne(recipeId)).rejects.toThrow(
      new NotFoundException('Recipe not found'),
    );
  });

  it('returns paginated recipe cards with signed image URLs', async () => {
    recipeCount.mockResolvedValue(1);
    recipeFindMany.mockResolvedValue([
      {
        id: recipeId,
        title: createRecipeDto.title,
        category: createRecipeDto.category,
        difficulty: createRecipeDto.difficulty,
        time: createRecipeDto.time,
        servings: createRecipeDto.servings,
        images: [{ s3Key: imageKey }],
      },
    ]);

    await expect(service.findAll({ page: 1, limit: 20 })).resolves.toEqual({
      recipes: [
        {
          id: recipeId,
          title: createRecipeDto.title,
          category: createRecipeDto.category,
          difficulty: createRecipeDto.difficulty,
          time: createRecipeDto.time,
          servings: createRecipeDto.servings,
          imageUrls: [signedUrl(imageKey)],
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it('caps the requested limit and calculates pagination', async () => {
    recipeCount.mockResolvedValue(250);
    recipeFindMany.mockResolvedValue([]);

    await expect(service.findAll({ page: 2, limit: 500 })).resolves.toEqual({
      recipes: [],
      pagination: {
        total: 250,
        page: 2,
        limit: MAX_RECIPES_LIMIT,
        totalPages: 3,
      },
    });
    expect(recipeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: MAX_RECIPES_LIMIT,
        take: MAX_RECIPES_LIMIT,
      }),
    );
  });

  it('combines all recipe filters with AND', async () => {
    recipeCount.mockResolvedValue(0);
    recipeFindMany.mockResolvedValue([]);

    await service.findAll({
      page: 1,
      limit: 20,
      name: 'pasta',
      ingredient: [tomatoId, oilId],
      category: RecipeCategory.ALMUERZO,
      difficulty: RecipeDifficulty.FACIL,
    });

    const expectedWhere = {
      AND: [
        { title: { contains: 'pasta', mode: 'insensitive' } },
        { ingredients: { some: { ingredientId: tomatoId } } },
        { ingredients: { some: { ingredientId: oilId } } },
        { category: RecipeCategory.ALMUERZO },
        { difficulty: RecipeDifficulty.FACIL },
      ],
    };
    expect(recipeCount).toHaveBeenCalledWith({ where: expectedWhere });
    expect(recipeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
  });

  it('returns an empty first page when there are no recipes', async () => {
    recipeCount.mockResolvedValue(0);
    recipeFindMany.mockResolvedValue([]);

    await expect(service.findAll({ page: 1, limit: 20 })).resolves.toEqual({
      recipes: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
  });

  it('returns the exact recipe selector enum values', () => {
    expect(service.getMetadata()).toEqual({
      categories: Object.values(RecipeCategory),
      difficulties: Object.values(RecipeDifficulty),
      units: Object.values(IngredientUnit),
      timeUnits: Object.values(RecipeTimeUnit),
    });
  });

  it('creates a recipe only after validating the uploaded image', async () => {
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    recipeCreate.mockResolvedValue(recipeRecord());

    const createdRecipe = await service.create(createRecipeDto);

    expect(objectExists).toHaveBeenCalledWith(imageKey);
    expect(createdRecipe.imageUrl).toBe(signedUrl(imageKey));
    const createArguments = recipeCreate.mock
      .calls[0][0] as RecipeCreateArguments;
    expect(createArguments.data).toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      images: { create: { s3Key: imageKey } },
      ingredients: { create: createRecipeDto.ingredients },
      steps: {
        create: [
          { stepNumber: 1, text: 'Cortar el tomate.' },
          { stepNumber: 2, text: 'Mezclar los ingredientes.' },
        ],
      },
    });
  });

  it('rejects a key that does not correspond to an uploaded object', async () => {
    objectExists.mockResolvedValue(false);

    await expect(service.create(createRecipeDto)).rejects.toThrow(
      new BadRequestException('La imagen indicada no existe en S3'),
    );
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('rejects missing catalog ingredients before creating a recipe', async () => {
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }]);

    await expect(service.create(createRecipeDto)).rejects.toThrow(
      new BadRequestException(
        `Los siguientes ingredientes no existen: ${oilId}`,
      ),
    );
    expect(recipeCreate).not.toHaveBeenCalled();
  });

  it('replaces the image reference and deletes the previous object', async () => {
    const newImageKey = 'recipes/new.webp';
    recipeFindUnique.mockResolvedValue(recipeRecord([imageKey]));
    recipeUpdate.mockResolvedValue(recipeRecord([newImageKey]));

    const recipe = await service.updateImage(recipeId, {
      imageKey: newImageKey,
    });

    expect(objectExists).toHaveBeenCalledWith(newImageKey);
    expect(recipeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: recipeId },
        data: {
          images: {
            deleteMany: {},
            create: { s3Key: newImageKey },
          },
        },
      }),
    );
    expect(deleteObject).toHaveBeenCalledWith(imageKey);
    expect(recipe.imageUrls).toEqual([signedUrl(newImageKey)]);
  });

  it('keeps the current image when an update has no new key', async () => {
    recipeFindUnique.mockResolvedValue(recipeRecord([imageKey]));

    const recipe = await service.updateImage(recipeId, {});

    expect(recipe.imageUrls).toEqual([signedUrl(imageKey)]);
    expect(objectExists).not.toHaveBeenCalled();
    expect(recipeUpdate).not.toHaveBeenCalled();
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('does not update a recipe when its new image does not exist', async () => {
    recipeFindUnique.mockResolvedValue(recipeRecord([imageKey]));
    objectExists.mockResolvedValue(false);

    await expect(
      service.updateImage(recipeId, { imageKey: 'recipes/missing.webp' }),
    ).rejects.toThrow(
      new BadRequestException('La imagen indicada no existe en S3'),
    );
    expect(recipeUpdate).not.toHaveBeenCalled();
  });

  it('returns 404 when updating a recipe that does not exist', async () => {
    recipeFindUnique.mockResolvedValue(null);

    await expect(service.updateImage(recipeId, { imageKey })).rejects.toThrow(
      new NotFoundException('Recipe not found'),
    );
  });

  it('deletes a recipe, its database relations and its S3 objects', async () => {
    recipeFindUnique.mockResolvedValue({ images: [{ s3Key: imageKey }] });

    await service.remove(recipeId);

    expect(recipeIngredientDeleteMany).toHaveBeenCalledWith({
      where: { recipeId },
    });
    expect(recipeStepDeleteMany).toHaveBeenCalledWith({
      where: { recipeId },
    });
    expect(recipeImageDeleteMany).toHaveBeenCalledWith({
      where: { recipeId },
    });
    expect(recipeDelete).toHaveBeenCalledWith({ where: { id: recipeId } });
    expect(deleteObject).toHaveBeenCalledWith(imageKey);
  });

  it('returns 404 when deleting a recipe that does not exist', async () => {
    recipeFindUnique.mockResolvedValue(null);

    await expect(service.remove(recipeId)).rejects.toThrow(
      new NotFoundException('Recipe not found'),
    );
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('logs an S3 deletion failure without blocking recipe deletion', async () => {
    const error = new Error('S3 unavailable');
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    recipeFindUnique.mockResolvedValue({ images: [{ s3Key: imageKey }] });
    deleteObject.mockRejectedValue(error);

    await expect(service.remove(recipeId)).resolves.toBeUndefined();
    expect(loggerError).toHaveBeenCalledWith(
      `No se pudo borrar de S3 la imagen ${imageKey}`,
      error.stack,
    );
  });
});
