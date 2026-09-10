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
    images: { create: Array<{ s3Key: string }> };
    ingredients: { create: CreateRecipeDto['ingredients'] };
    steps: { create: Array<{ stepNumber: number; text: string }> };
  };
};

describe('RecipesService', () => {
  const tomatoId = '11111111-1111-4111-8111-111111111111';
  const oilId = '22222222-2222-4222-8222-222222222222';
  const recipeId = '33333333-3333-4333-8333-333333333333';
  const imageKey = 'recipes/image.webp';
  const secondaryImageKey = 'recipes/secondary.webp';
  const signedUrl = (key: string): string => `https://signed.test/${key}`;
  const createRecipeDto: CreateRecipeDto = {
    title: 'Ensalada de tomate',
    description: 'Una ensalada fresca.',
    category: RecipeCategory.ENTRADA,
    time: 10,
    timeUnit: RecipeTimeUnit.MINUTOS,
    difficulty: RecipeDifficulty.FACIL,
    servings: 2,
    imageKeys: [imageKey, secondaryImageKey],
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
  const transactionRecipeFindUniqueOrThrow = jest.fn<
    Promise<Record<string, unknown>>,
    [unknown]
  >();
  const transactionRecipeUpdate = jest.fn<Promise<unknown>, [unknown]>();
  const recipeDelete = jest.fn<Promise<unknown>, [unknown]>();
  const transactionRecipeIngredientFindMany = jest.fn<
    Promise<
      Array<{
        ingredientId: string;
        amount: string;
        unit: IngredientUnit;
      }>
    >,
    [unknown]
  >();
  const recipeIngredientDeleteMany = jest.fn<Promise<unknown>, [unknown]>();
  const recipeIngredientCreateMany = jest.fn<Promise<unknown>, [unknown]>();
  const recipeIngredientUpdate = jest.fn<Promise<unknown>, [unknown]>();
  const recipeStepDeleteMany = jest.fn<Promise<unknown>, [unknown]>();
  const recipeStepCreateMany = jest.fn<Promise<unknown>, [unknown]>();
  const recipeImageFindMany = jest.fn<
    Promise<Array<{ s3Key: string }>>,
    [unknown]
  >();
  const recipeImageDeleteMany = jest.fn<Promise<unknown>, [unknown]>();
  const recipeImageCreateMany = jest.fn<Promise<unknown>, [unknown]>();
  const runTransaction = jest.fn<
    Promise<unknown>,
    [(transaction: unknown) => Promise<unknown>]
  >();
  const objectExists = jest.fn<Promise<boolean>, [string]>();
  const deleteObject = jest.fn<Promise<void>, [string]>();
  const getSignedReadUrl = jest.fn<Promise<string>, [string]>();
  const getSignedUploadUrl = jest.fn<Promise<string>, [string, string]>();
  let service: RecipesService;

  beforeEach(() => {
    jest.clearAllMocks();
    runTransaction.mockImplementation(
      async (operation: (transaction: unknown) => Promise<unknown>) =>
        operation({
          ingredient: { findMany: ingredientFindMany },
          recipe: {
            create: recipeCreate,
            delete: recipeDelete,
            findUniqueOrThrow: transactionRecipeFindUniqueOrThrow,
            update: transactionRecipeUpdate,
          },
          recipeIngredient: {
            findMany: transactionRecipeIngredientFindMany,
            deleteMany: recipeIngredientDeleteMany,
            createMany: recipeIngredientCreateMany,
            update: recipeIngredientUpdate,
          },
          recipeStep: {
            deleteMany: recipeStepDeleteMany,
            createMany: recipeStepCreateMany,
          },
          recipeImage: {
            deleteMany: recipeImageDeleteMany,
            createMany: recipeImageCreateMany,
          },
        }),
    );
    objectExists.mockResolvedValue(true);
    transactionRecipeIngredientFindMany.mockResolvedValue(
      createRecipeDto.ingredients.map(({ ingredientId, amount, unit }) => ({
        ingredientId,
        amount,
        unit,
      })),
    );
    recipeImageFindMany.mockResolvedValue([]);
    deleteObject.mockResolvedValue(undefined);
    getSignedReadUrl.mockImplementation((key: string) =>
      Promise.resolve(signedUrl(key)),
    );
    getSignedUploadUrl.mockResolvedValue('https://upload.test');

    service = new RecipesService(
      {
        $transaction: runTransaction,
        recipe: {
          count: recipeCount,
          findMany: recipeFindMany,
          findUnique: recipeFindUnique,
        },
        recipeImage: { findMany: recipeImageFindMany },
      } as unknown as PrismaService,
      {
        objectExists,
        deleteObject,
        getSignedReadUrl,
        getSignedUploadUrl,
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

  it('generates a safe image key and signed upload URL', async () => {
    const result = await service.createImageUploadUrl({
      contentType: 'image/png',
    });

    expect(result.uploadUrl).toBe('https://upload.test');
    expect(result.imageKey).toMatch(/^recipes\/[0-9a-f-]{36}\.png$/);
    expect(getSignedUploadUrl).toHaveBeenCalledWith(
      result.imageKey,
      'image/png',
    );
  });

  it('creates a recipe after validating every uploaded image', async () => {
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    recipeCreate.mockResolvedValue(recipeRecord([imageKey, secondaryImageKey]));

    const createdRecipe = await service.create(createRecipeDto);

    expect(objectExists).toHaveBeenCalledWith(imageKey);
    expect(objectExists).toHaveBeenCalledWith(secondaryImageKey);
    expect(createdRecipe.imageUrls).toEqual([
      signedUrl(imageKey),
      signedUrl(secondaryImageKey),
    ]);
    const createArguments = recipeCreate.mock
      .calls[0][0] as RecipeCreateArguments;
    expect(createArguments.data).toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      images: {
        create: [{ s3Key: imageKey }, { s3Key: secondaryImageKey }],
      },
      ingredients: { create: createRecipeDto.ingredients },
      steps: {
        create: [
          { stepNumber: 1, text: 'Cortar el tomate.' },
          { stepNumber: 2, text: 'Mezclar los ingredientes.' },
        ],
      },
    });
  });

  it('creates a recipe without images when imageKeys is omitted', async () => {
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    recipeCreate.mockResolvedValue(recipeRecord([]));
    const recipeWithoutImages = { ...createRecipeDto, imageKeys: undefined };

    const createdRecipe = await service.create(recipeWithoutImages);

    expect(objectExists).not.toHaveBeenCalled();
    expect(createdRecipe.imageUrls).toEqual([]);
    const createArguments = recipeCreate.mock
      .calls[0][0] as RecipeCreateArguments;
    expect(createArguments.data.images).toEqual({ create: [] });
  });

  it('rejects a key that does not correspond to an uploaded object', async () => {
    objectExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await expect(service.create(createRecipeDto)).rejects.toThrow(
      new BadRequestException(
        `Las siguientes imágenes no existen en S3: ${secondaryImageKey}`,
      ),
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

  it('replaces recipe fields, ingredients, steps and images atomically', async () => {
    const newImageKeys = ['recipes/new.webp', 'recipes/new-secondary.webp'];
    const updateRecipeDto = {
      ...createRecipeDto,
      title: 'Ensalada actualizada',
      ingredients: [
        { ingredientId: tomatoId, amount: '3', unit: IngredientUnit.UNIDAD },
        { ingredientId: oilId, amount: '2', unit: IngredientUnit.CUCHARADA },
      ],
      steps: ['Paso nuevo 1.', 'Paso nuevo 2.'],
      imageKeys: newImageKeys,
    };
    recipeFindUnique.mockResolvedValue({
      images: [{ s3Key: imageKey }],
    });
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    transactionRecipeFindUniqueOrThrow.mockResolvedValue({
      ...recipeRecord(newImageKeys),
      title: updateRecipeDto.title,
    });

    const recipe = await service.update(recipeId, updateRecipeDto);

    expect(transactionRecipeUpdate).toHaveBeenCalledWith({
      where: { id: recipeId },
      data: {
        title: 'Ensalada actualizada',
        description: createRecipeDto.description,
        category: createRecipeDto.category,
        time: createRecipeDto.time,
        timeUnit: createRecipeDto.timeUnit,
        difficulty: createRecipeDto.difficulty,
        servings: createRecipeDto.servings,
      },
    });
    expect(recipeIngredientDeleteMany).toHaveBeenCalledWith({
      where: {
        recipeId,
        ingredientId: { notIn: [tomatoId, oilId] },
      },
    });
    expect(recipeIngredientCreateMany).not.toHaveBeenCalled();
    expect(recipeIngredientUpdate).toHaveBeenCalledTimes(2);
    expect(recipeStepDeleteMany).toHaveBeenCalledWith({ where: { recipeId } });
    expect(recipeStepCreateMany).toHaveBeenCalledWith({
      data: [
        { recipeId, stepNumber: 1, text: 'Paso nuevo 1.' },
        { recipeId, stepNumber: 2, text: 'Paso nuevo 2.' },
      ],
    });
    expect(objectExists).toHaveBeenCalledWith(newImageKeys[0]);
    expect(objectExists).toHaveBeenCalledWith(newImageKeys[1]);
    expect(recipeImageDeleteMany).toHaveBeenCalledWith({
      where: { recipeId },
    });
    expect(recipeImageCreateMany).toHaveBeenCalledWith({
      data: newImageKeys.map((s3Key) => ({ recipeId, s3Key })),
    });
    expect(deleteObject).toHaveBeenCalledWith(imageKey);
    expect(recipe.title).toBe('Ensalada actualizada');
    expect(recipe.imageUrls).toEqual(newImageKeys.map(signedUrl));
  });

  it('keeps current images when a complete update omits imageKeys', async () => {
    recipeFindUnique.mockResolvedValue({
      images: [{ s3Key: imageKey }],
    });
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    transactionRecipeFindUniqueOrThrow.mockResolvedValue(
      recipeRecord([imageKey]),
    );

    const recipe = await service.update(recipeId, {
      ...createRecipeDto,
      imageKeys: undefined,
    });

    expect(recipe.imageUrls).toEqual([signedUrl(imageKey)]);
    expect(objectExists).not.toHaveBeenCalled();
    expect(recipeImageDeleteMany).not.toHaveBeenCalled();
    expect(recipeImageCreateMany).not.toHaveBeenCalled();
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('removes every image when an update sends an empty list', async () => {
    recipeFindUnique.mockResolvedValue({
      images: [{ s3Key: imageKey }, { s3Key: secondaryImageKey }],
    });
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    transactionRecipeFindUniqueOrThrow.mockResolvedValue(recipeRecord([]));

    const recipe = await service.update(recipeId, {
      ...createRecipeDto,
      imageKeys: [],
    });

    expect(recipeImageDeleteMany).toHaveBeenCalledWith({
      where: { recipeId },
    });
    expect(recipeImageCreateMany).not.toHaveBeenCalled();
    expect(deleteObject).toHaveBeenCalledWith(imageKey);
    expect(deleteObject).toHaveBeenCalledWith(secondaryImageKey);
    expect(recipe.imageUrls).toEqual([]);
  });

  it('does not update a recipe when a new image does not exist', async () => {
    recipeFindUnique.mockResolvedValue({
      images: [{ s3Key: imageKey }],
    });
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    objectExists.mockResolvedValue(false);

    await expect(
      service.update(recipeId, {
        ...createRecipeDto,
        imageKeys: ['recipes/missing.webp'],
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Las siguientes imágenes no existen en S3: recipes/missing.webp',
      ),
    );
    expect(runTransaction).not.toHaveBeenCalled();
    expect(transactionRecipeUpdate).not.toHaveBeenCalled();
  });

  it('rolls back before changes when an update ingredient is missing', async () => {
    recipeFindUnique.mockResolvedValue({ images: [] });
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }]);

    await expect(service.update(recipeId, createRecipeDto)).rejects.toThrow(
      new BadRequestException(
        `Los siguientes ingredientes no existen: ${oilId}`,
      ),
    );
    expect(transactionRecipeUpdate).not.toHaveBeenCalled();
    expect(recipeIngredientDeleteMany).not.toHaveBeenCalled();
    expect(recipeStepDeleteMany).not.toHaveBeenCalled();
  });

  it('returns 404 when updating a recipe that does not exist', async () => {
    recipeFindUnique.mockResolvedValue(null);

    await expect(service.update(recipeId, createRecipeDto)).rejects.toThrow(
      new NotFoundException('Recipe not found'),
    );
    expect(objectExists).not.toHaveBeenCalled();
    expect(runTransaction).not.toHaveBeenCalled();
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

  it('does not delete an updated image that another recipe still uses', async () => {
    const newImageKey = 'recipes/new.webp';
    recipeFindUnique.mockResolvedValue({
      images: [{ s3Key: imageKey }],
    });
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    transactionRecipeFindUniqueOrThrow.mockResolvedValue(
      recipeRecord([newImageKey]),
    );
    recipeImageFindMany.mockResolvedValue([{ s3Key: imageKey }]);

    await service.update(recipeId, {
      ...createRecipeDto,
      imageKeys: [newImageKey],
    });

    expect(recipeImageFindMany).toHaveBeenCalledWith({
      where: {
        s3Key: { in: [imageKey] },
        recipeId: { not: recipeId },
      },
      select: { s3Key: true },
    });
    expect(deleteObject).not.toHaveBeenCalledWith(imageKey);
  });

  it('logs an S3 cleanup failure without failing a successful update', async () => {
    const newImageKey = 'recipes/new.webp';
    const error = new Error('S3 unavailable');
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    recipeFindUnique.mockResolvedValue({
      images: [{ s3Key: imageKey }],
    });
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    transactionRecipeFindUniqueOrThrow.mockResolvedValue(
      recipeRecord([newImageKey]),
    );
    deleteObject.mockRejectedValue(error);

    await expect(
      service.update(recipeId, {
        ...createRecipeDto,
        imageKeys: [newImageKey],
      }),
    ).resolves.toMatchObject({ id: recipeId });
    expect(loggerError).toHaveBeenCalledWith(
      `No se pudo borrar de S3 la imagen ${imageKey}`,
      error.stack,
    );
  });

  it('does not delete a removed recipe image that another recipe still uses', async () => {
    recipeFindUnique.mockResolvedValue({ images: [{ s3Key: imageKey }] });
    recipeImageFindMany.mockResolvedValue([{ s3Key: imageKey }]);

    await service.remove(recipeId);

    expect(recipeImageFindMany).toHaveBeenCalledWith({
      where: {
        s3Key: { in: [imageKey] },
        recipeId: { not: recipeId },
      },
      select: { s3Key: true },
    });
    expect(deleteObject).not.toHaveBeenCalled();
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
