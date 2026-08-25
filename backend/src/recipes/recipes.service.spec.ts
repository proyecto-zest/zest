import { BadRequestException } from '@nestjs/common';
import { RecipeCategory } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  DEFAULT_RECIPE_AUTHOR_ID,
  DEFAULT_RECIPE_IMAGE_URL,
} from './recipes.constants';
import { RecipesService } from './recipes.service';

type RecipeCreateArguments = {
  data: {
    authorId: string;
    ingredients: { create: CreateRecipeDto['ingredients'] };
    steps: { create: Array<{ stepNumber: number; text: string }> };
    images: { create: { imageUrl: string } };
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
  const createRecipeDto: CreateRecipeDto = {
    title: 'Ensalada de tomate',
    description: 'Una ensalada fresca.',
    category: RecipeCategory.ENTRADA,
    time: 10,
    difficulty: 'FACIL',
    servings: 2,
    ingredients: [
      { ingredientId: tomatoId, amount: '2 unidades' },
      { ingredientId: oilId, amount: '1 cucharada' },
    ],
    steps: ['Cortar el tomate.', 'Mezclar los ingredientes.'],
  };

  let ingredientFindMany: IngredientFindManyMock;
  let recipeCreate: RecipeCreateMock;
  let runTransaction: jest.Mock<Promise<unknown>, [TransactionOperation]>;
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
    service = new RecipesService({
      $transaction: runTransaction,
    } as unknown as PrismaService);
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
      difficulty: createRecipeDto.difficulty,
      servings: createRecipeDto.servings,
      ingredients: [],
      steps: [],
      images: [{ imageUrl: DEFAULT_RECIPE_IMAGE_URL }],
    });

    await expect(service.create(createRecipeDto)).resolves.toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
      imageUrl: DEFAULT_RECIPE_IMAGE_URL,
    });
    expect(runTransaction).toHaveBeenCalledTimes(1);
    const [createArguments] = recipeCreate.mock.calls[0] as [
      RecipeCreateArguments,
    ];

    expect(createArguments.data).toMatchObject({
      authorId: DEFAULT_RECIPE_AUTHOR_ID,
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
        create: { imageUrl: DEFAULT_RECIPE_IMAGE_URL },
      },
    });
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
