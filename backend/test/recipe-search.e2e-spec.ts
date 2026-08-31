import { INestApplication } from '@nestjs/common';
import {
  IngredientUnit,
  PrismaClient,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PaginatedRecipesResponseDto } from '../src/recipes/dto/recipe-response.dto';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

type SearchRecipes = {
  pastaTomato: string;
  tomatoSoup: string;
  greenPasta: string;
  salad: string;
};

describeWithDatabase('GET /recipes search (e2e)', () => {
  const prisma = new PrismaClient();
  const recipes: SearchRecipes = {
    pastaTomato: '14141414-1414-4414-8414-141414141401',
    tomatoSoup: '14141414-1414-4414-8414-141414141402',
    greenPasta: '14141414-1414-4414-8414-141414141403',
    salad: '14141414-1414-4414-8414-141414141404',
  };
  const testRecipeIds = Object.values(recipes);
  const ingredientNames = {
    tomato: 'Tomate búsqueda ZEST-14',
    cheese: 'Queso búsqueda ZEST-14',
    basil: 'Albahaca búsqueda ZEST-14',
  };
  let app: INestApplication;
  let tomatoId: string;
  let cheeseId: string;

  const cleanSearchData = async (): Promise<void> => {
    await prisma.recipeImage.deleteMany({
      where: { recipeId: { in: testRecipeIds } },
    });
    await prisma.recipeStep.deleteMany({
      where: { recipeId: { in: testRecipeIds } },
    });
    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: { in: testRecipeIds } },
    });
    await prisma.recipe.deleteMany({
      where: { id: { in: testRecipeIds } },
    });
    await prisma.ingredient.deleteMany({
      where: { name: { in: Object.values(ingredientNames) } },
    });
  };

  const createRecipe = async (
    id: string,
    title: string,
    category: RecipeCategory,
    difficulty: RecipeDifficulty,
    ingredientIds: string[],
  ): Promise<void> => {
    await prisma.recipe.create({
      data: {
        id,
        title,
        description: `Descripción de ${title}`,
        category,
        time: 30,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty,
        servings: 2,
        ingredients: {
          create: ingredientIds.map((ingredientId) => ({
            ingredientId,
            amount: '1',
            unit: IngredientUnit.UNIDAD,
          })),
        },
      },
    });
  };

  const createSearchData = async (): Promise<void> => {
    const [tomato, cheese, basil] = await Promise.all([
      prisma.ingredient.create({ data: { name: ingredientNames.tomato } }),
      prisma.ingredient.create({ data: { name: ingredientNames.cheese } }),
      prisma.ingredient.create({ data: { name: ingredientNames.basil } }),
    ]);
    tomatoId = tomato.id;
    cheeseId = cheese.id;

    await Promise.all([
      createRecipe(
        recipes.pastaTomato,
        'Pasta de tomate',
        RecipeCategory.ALMUERZO,
        RecipeDifficulty.FACIL,
        [tomato.id, cheese.id],
      ),
      createRecipe(
        recipes.tomatoSoup,
        'Sopa de tomate',
        RecipeCategory.CENA,
        RecipeDifficulty.FACIL,
        [tomato.id],
      ),
      createRecipe(
        recipes.greenPasta,
        'Pasta verde',
        RecipeCategory.ALMUERZO,
        RecipeDifficulty.MEDIA,
        [basil.id, cheese.id],
      ),
      createRecipe(
        recipes.salad,
        'Ensalada fresca',
        RecipeCategory.ENTRADA,
        RecipeDifficulty.FACIL,
        [basil.id],
      ),
    ]);
  };

  const responseIds = (body: PaginatedRecipesResponseDto): Set<string> =>
    new Set(body.recipes.map(({ id }) => id));

  beforeAll(async () => {
    await prisma.$connect();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(async () => {
    await cleanSearchData();
    await createSearchData();
  });

  afterAll(async () => {
    await cleanSearchData();
    await app.close();
    await prisma.$disconnect();
  });

  it('filters recipes by a partial case-insensitive name', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/recipes?name=PASTA')
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(
      new Set([recipes.pastaTomato, recipes.greenPasta]),
    );
    expect(body.pagination.total).toBe(2);
  });

  it('filters recipes by one ingredient', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes?ingredient=${tomatoId}`)
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(
      new Set([recipes.pastaTomato, recipes.tomatoSoup]),
    );
  });

  it('requires all ingredients when more than one is selected', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes?ingredient=${tomatoId}&ingredient=${cheeseId}`)
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(new Set([recipes.pastaTomato]));
  });

  it('filters recipes by category', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes?category=${RecipeCategory.ALMUERZO}`)
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(
      new Set([recipes.pastaTomato, recipes.greenPasta]),
    );
  });

  it('filters recipes by difficulty', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes?difficulty=${RecipeDifficulty.FACIL}`)
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(
      new Set([recipes.pastaTomato, recipes.tomatoSoup, recipes.salad]),
    );
  });

  it('combines all filters and returns their intersection', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(
        `/recipes?name=pasta&ingredient=${cheeseId}&category=${RecipeCategory.ALMUERZO}&difficulty=${RecipeDifficulty.FACIL}`,
      )
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(new Set([recipes.pastaTomato]));
    expect(body.pagination.total).toBe(1);
  });

  it('returns the complete paginated feed when filters are omitted', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/recipes?page=1&limit=2')
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(body.recipes).toHaveLength(2);
    expect(body.pagination).toEqual({
      total: 4,
      page: 1,
      limit: 2,
      totalPages: 2,
    });
  });
});
