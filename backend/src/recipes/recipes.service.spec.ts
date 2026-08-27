import { BadRequestException } from '@nestjs/common';
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
  let runTransaction: jest.Mock<Promise<unknown>, [TransactionOperation]>;
  let configGetOrThrow: jest.Mock<string, [string]>;
  let service: RecipesService;

  beforeEach(() => {
    ingredientFindMany = jest.fn<Promise<Array<{ id: string }>>, [unknown]>();
    recipeCreate = jest.fn<Promise<Record<string, unknown>>, [unknown]>();
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
      } as unknown as PrismaService,
      {
        getOrThrow: configGetOrThrow,
      } as unknown as ConfigService,
    );
  });

  it('returns the exact recipe selector enum values', () => {
    expect(service.getMetadata()).toEqual({
      categories: Object.values(RecipeCategory),
      difficulties: Object.values(RecipeDifficulty),
      units: Object.values(IngredientUnit),
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
    });

    await expect(service.create(createRecipeDto)).resolves.toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      imageUrl: defaultImageUrl,
    });
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
