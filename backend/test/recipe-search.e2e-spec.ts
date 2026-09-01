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
import { resetTestDatabase } from './test-database';

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
  const ingredientNames = {
    tomato: 'Tomate búsqueda ZEST-14',
    cheese: 'Queso búsqueda ZEST-14',
    basil: 'Albahaca búsqueda ZEST-14',
  };
  let app: INestApplication;
  let recipes: SearchRecipes;
  let tomatoId: string;
  let cheeseId: string;

  const createRecipe = async (
    title: string,
    category: RecipeCategory,
    difficulty: RecipeDifficulty,
    ingredientIds: string[],
  ): Promise<string> => {
    const recipe = await prisma.recipe.create({
      data: {
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

    return recipe.id;
  };

  const createSearchData = async (): Promise<void> => {
    const [tomato, cheese, basil] = await Promise.all([
      prisma.ingredient.create({ data: { name: ingredientNames.tomato } }),
      prisma.ingredient.create({ data: { name: ingredientNames.cheese } }),
      prisma.ingredient.create({ data: { name: ingredientNames.basil } }),
    ]);
    tomatoId = tomato.id;
    cheeseId = cheese.id;

    const [pastaTomato, tomatoSoup, greenPasta, salad] = await Promise.all([
      createRecipe(
        'Pasta de tomate',
        RecipeCategory.ALMUERZO,
        RecipeDifficulty.FACIL,
        [tomato.id, cheese.id],
      ),
      createRecipe(
        'Sopa de tomate',
        RecipeCategory.CENA,
        RecipeDifficulty.FACIL,
        [tomato.id],
      ),
      createRecipe(
        'Pasta verde',
        RecipeCategory.ALMUERZO,
        RecipeDifficulty.MEDIA,
        [basil.id, cheese.id],
      ),
      createRecipe(
        'Ensalada fresca',
        RecipeCategory.ENTRADA,
        RecipeDifficulty.FACIL,
        [basil.id],
      ),
    ]);
    recipes = { pastaTomato, tomatoSoup, greenPasta, salad };
  };

  const responseIds = (body: PaginatedRecipesResponseDto): Set<string> =>
    new Set(body.recipes.map(({ id }) => id));

  beforeAll(async () => {
    await prisma.$connect();
    await resetTestDatabase(prisma);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
    await createSearchData();
  });

  afterAll(async () => {
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
