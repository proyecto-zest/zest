import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IngredientUnit,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  DEFAULT_RECIPE_AUTHOR_ID,
  DEFAULT_RECIPE_IMAGE_KEY,
  MAX_RECIPES_LIMIT,
} from './recipes.constants';
import { RecipesService } from './recipes.service';

type RecipeCreateArguments = {
  data: {
    authorId: string;
    timeUnit: RecipeTimeUnit;
    ingredients: { create: CreateRecipeDto['ingredients'] };
    steps: { create: Array<{ stepNumber: number; text: string }> };
    images: { create: { s3Key: string } };
  };
};

type IngredientFindManyMock = jest.Mock<
  Promise<Array<{ id: string }>>,
  [unknown]
>;

type RecipeCreateMock = jest.Mock<Promise<Record<string, unknown>>, [unknown]>;

type RecipeCountMock = jest.Mock<Promise<number>, [unknown]>;

type RecipeFindManyMock = jest.Mock<
  Promise<Array<Record<string, unknown>>>,
  [unknown]
>;

type RecipeFindUniqueMock = jest.Mock<
  Promise<Record<string, unknown> | null>,
  [unknown]
>;

type TransactionClientMock = {
  ingredient: { findMany: IngredientFindManyMock };
  recipe: { create: RecipeCreateMock };
};

type TransactionOperation = (
  transaction: TransactionClientMock,
) => Promise<unknown>;

describe('RecipesService', () => {
  const tomatoId = '11111111-1111-4111-8111-111111111111';
  const oilId = '22222222-2222-4222-8222-222222222222';
  const defaultImageUrl =
    'https://zest-images-test.s3.us-east-1.amazonaws.com/recipes/default.webp';
  const secondaryImageUrl =
    'https://zest-images-test.s3.us-east-1.amazonaws.com/recipes/secondary.webp';
  const createRecipeDto: CreateRecipeDto = {
    title: 'Ensalada de tomate',
    description: 'Una ensalada fresca.',
    category: RecipeCategory.ENTRADA,
    time: 10,
    timeUnit: RecipeTimeUnit.MINUTOS,
    difficulty: RecipeDifficulty.FACIL,
    servings: 2,
    ingredients: [
      { ingredientId: tomatoId, amount: '2', unit: IngredientUnit.UNIDAD },
      { ingredientId: oilId, amount: '1', unit: IngredientUnit.CUCHARADA },
    ],
    steps: ['Cortar el tomate.', 'Mezclar los ingredientes.'],
  };

  let ingredientFindMany: IngredientFindManyMock;
  let recipeCreate: RecipeCreateMock;
  let recipeCount: RecipeCountMock;
  let recipeFindMany: RecipeFindManyMock;
  let recipeFindUnique: RecipeFindUniqueMock;
  let runTransaction: jest.Mock<Promise<unknown>, [TransactionOperation]>;
  let configGetOrThrow: jest.Mock<string, [string]>;
  let service: RecipesService;

  beforeEach(() => {
    ingredientFindMany = jest.fn<Promise<Array<{ id: string }>>, [unknown]>();
    recipeCreate = jest.fn<Promise<Record<string, unknown>>, [unknown]>();
    recipeCount = jest.fn<Promise<number>, [unknown]>();
    recipeFindMany = jest.fn<
      Promise<Array<Record<string, unknown>>>,
      [unknown]
    >();
    recipeFindUnique = jest.fn<
      Promise<Record<string, unknown> | null>,
      [unknown]
    >();
    runTransaction = jest.fn<Promise<unknown>, [TransactionOperation]>(
      async (operation) =>
        operation({
          ingredient: { findMany: ingredientFindMany },
          recipe: { create: recipeCreate },
        }),
    );
    configGetOrThrow = jest.fn((key: string) => {
      if (key === 'AWS_S3_BUCKET') return 'zest-images-test';
      if (key === 'AWS_S3_REGION') return 'us-east-1';

      throw new Error(`Unexpected config key: ${key}`);
    });
    service = new RecipesService(
      {
        $transaction: runTransaction,
        recipe: {
          count: recipeCount,
          findMany: recipeFindMany,
          findUnique: recipeFindUnique,
        },
      } as unknown as PrismaService,
      {
        getOrThrow: configGetOrThrow,
      } as unknown as ConfigService,
    );
  });

  it('returns a recipe with ingredients, steps and images', async () => {
    const recipeId = '33333333-3333-4333-8333-333333333333';
    recipeFindUnique.mockResolvedValue({
      id: recipeId,
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      title: 'Ensalada de tomate',
      description: 'Una ensalada fresca.',
      category: RecipeCategory.ENTRADA,
      time: 10,
      timeUnit: RecipeTimeUnit.MINUTOS,
      difficulty: RecipeDifficulty.FACIL,
      servings: 2,
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
      images: [
        {
          s3Key: DEFAULT_RECIPE_IMAGE_KEY,
        },
        {
          s3Key: 'recipes/secondary.webp',
        },
      ],
      internalField: 'must not be exposed',
    });

    await expect(service.findOne(recipeId)).resolves.toEqual({
      id: recipeId,
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      title: 'Ensalada de tomate',
      description: 'Una ensalada fresca.',
      category: RecipeCategory.ENTRADA,
      time: 10,
      timeUnit: RecipeTimeUnit.MINUTOS,
      difficulty: RecipeDifficulty.FACIL,
      servings: 2,
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
      imageUrls: [defaultImageUrl, secondaryImageUrl],
    });
    expect(recipeFindUnique).toHaveBeenCalledWith({
      where: { id: recipeId },
      include: {
        ingredients: { include: { ingredient: true } },
        steps: { orderBy: { stepNumber: 'asc' } },
        images: { select: { s3Key: true } },
      },
    });
  });

  it('uses the default image when the recipe detail has no images', async () => {
    recipeFindUnique.mockResolvedValue({
      id: tomatoId,
      authorId: null,
      title: 'Receta sin imagen',
      description: 'Descripción.',
      category: RecipeCategory.ALMUERZO,
      time: 10,
      timeUnit: RecipeTimeUnit.MINUTOS,
      difficulty: RecipeDifficulty.FACIL,
      servings: 2,
      ingredients: [],
      steps: [],
      images: [],
    });

    const recipe = await service.findOne(tomatoId);

    expect(recipe.imageUrls).toEqual([defaultImageUrl]);
  });

  it('throws not found when the recipe does not exist', async () => {
    recipeFindUnique.mockResolvedValue(null);

    await expect(service.findOne(tomatoId)).rejects.toThrow(
      new NotFoundException('Recipe not found'),
    );
  });

  it('returns paginated recipe cards without nested records', async () => {
    recipeCount.mockResolvedValue(1);
    recipeFindMany.mockResolvedValue([
      {
        id: '33333333-3333-4333-8333-333333333333',
        title: 'Ensalada de tomate',
        category: RecipeCategory.ENTRADA,
        difficulty: RecipeDifficulty.FACIL,
        time: 10,
        servings: 2,
        images: [{ s3Key: 'recipes/recipe.webp' }],
      },
    ]);

    await expect(service.findAll({ page: 1, limit: 20 })).resolves.toEqual({
      recipes: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          title: 'Ensalada de tomate',
          category: RecipeCategory.ENTRADA,
          difficulty: RecipeDifficulty.FACIL,
          time: 10,
          servings: 2,
          imageUrl:
            'https://zest-images-test.s3.us-east-1.amazonaws.com/recipes/recipe.webp',
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    expect(recipeCount).toHaveBeenCalledWith({ where: {} });
    expect(recipeFindMany).toHaveBeenCalledWith({
      where: {},
      select: {
        id: true,
        title: true,
        category: true,
        difficulty: true,
        time: true,
        servings: true,
        images: { select: { s3Key: true }, take: 1 },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 0,
      take: 20,
    });
  });

  it('caps the requested limit and calculates its pagination', async () => {
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

  it('returns an empty first page when there are no recipes', async () => {
    recipeCount.mockResolvedValue(0);
    recipeFindMany.mockResolvedValue([]);

    await expect(service.findAll({ page: 1, limit: 20 })).resolves.toEqual({
      recipes: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    });
  });

  it('uses the default image when a recipe has no images', async () => {
    recipeCount.mockResolvedValue(1);
    recipeFindMany.mockResolvedValue([
      {
        id: '33333333-3333-4333-8333-333333333333',
        title: 'Ensalada de tomate',
        category: RecipeCategory.ENTRADA,
        difficulty: RecipeDifficulty.FACIL,
        time: 10,
        servings: 2,
        images: [],
      },
    ]);

    const result = await service.findAll({ page: 1, limit: 20 });

    expect(result.recipes[0].imageUrl).toBe(defaultImageUrl);
  });

  it('returns the exact recipe selector enum values', () => {
    expect(service.getMetadata()).toEqual({
      categories: Object.values(RecipeCategory),
      difficulties: Object.values(RecipeDifficulty),
      units: Object.values(IngredientUnit),
      timeUnits: Object.values(RecipeTimeUnit),
    });
  });

  it('creates the recipe and all nested records atomically', async () => {
    ingredientFindMany.mockResolvedValue([{ id: tomatoId }, { id: oilId }]);
    recipeCreate.mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      title: createRecipeDto.title,
      description: createRecipeDto.description,
      category: createRecipeDto.category,
      time: createRecipeDto.time,
      timeUnit: createRecipeDto.timeUnit,
      difficulty: createRecipeDto.difficulty,
      servings: createRecipeDto.servings,
      ingredients: [],
      steps: [],
      images: [{ s3Key: DEFAULT_RECIPE_IMAGE_KEY }],
      internalField: 'must not be exposed',
    });

    const createdRecipe = await service.create(createRecipeDto);

    expect(createdRecipe).toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      imageUrl: defaultImageUrl,
    });
    expect(createdRecipe).not.toHaveProperty('internalField');
    expect(runTransaction).toHaveBeenCalledTimes(1);
    const [createArguments] = recipeCreate.mock.calls[0] as [
      RecipeCreateArguments,
    ];

    expect(createArguments.data).toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      timeUnit: RecipeTimeUnit.MINUTOS,
      ingredients: {
        create: createRecipeDto.ingredients,
      },
      steps: {
        create: [
          { stepNumber: 1, text: 'Cortar el tomate.' },
          { stepNumber: 2, text: 'Mezclar los ingredientes.' },
        ],
      },
      images: {
        create: { s3Key: DEFAULT_RECIPE_IMAGE_KEY },
      },
    });
    expect(configGetOrThrow).toHaveBeenCalledWith('AWS_S3_BUCKET');
    expect(configGetOrThrow).toHaveBeenCalledWith('AWS_S3_REGION');
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
});
