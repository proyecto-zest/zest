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
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { configureApp } from '../src/configure-app';
import { PaginatedRecipesResponseDto } from '../src/recipes/dto/recipe-response.dto';
import { DEFAULT_RECIPE_AUTHOR_ID } from '../src/recipes/recipes.constants';
import { resetTestDatabase } from './test-database';
import { createDefaultTestUser } from './test-users';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

type SearchRecipes = {
  pastaTomato: string;
  tomatoSoup: string;
  greenPasta: string;
  salad: string;
  otherAuthorRecipe: string;
};

describeWithDatabase('GET /recipes search (e2e)', () => {
  const prisma = new PrismaClient();
  const ingredientNames = {
    tomato: 'tomato search zest-14',
    cheese: 'cheese search zest-14',
    basil: 'basil search zest-14',
  };
  let app: INestApplication;
  let recipes: SearchRecipes;
  let tomatoId: string;
  let cheeseId: string;
  let otherAuthorId: string;

  const createRecipe = async (
    title: string,
    category: RecipeCategory,
    difficulty: RecipeDifficulty,
    ingredientIds: string[],
    authorId: string = DEFAULT_RECIPE_AUTHOR_ID,
  ): Promise<string> => {
    const recipe = await prisma.recipe.create({
      data: {
        authorId,
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
      prisma.ingredient.create({
        data: {
          id: 'c02dfc85-b49c-5084-be73-00889918b2da',
          name: ingredientNames.tomato,
        },
      }),
      prisma.ingredient.create({ data: { name: ingredientNames.cheese } }),
      prisma.ingredient.create({ data: { name: ingredientNames.basil } }),
    ]);
    tomatoId = tomato.id;
    cheeseId = cheese.id;

    const otherAuthor = await prisma.user.create({
      data: {
        auth0Sub: 'auth0|zest-search-other-author',
        name: 'Camila Fontana',
        email: 'camila-search@zest.local',
        emailVerified: true,
      },
    });
    otherAuthorId = otherAuthor.id;

    const [pastaTomato, tomatoSoup, greenPasta, salad, otherAuthorRecipe] =
      await Promise.all([
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
        createRecipe(
          'Pasta de Camila',
          RecipeCategory.ALMUERZO,
          RecipeDifficulty.FACIL,
          [tomato.id],
          otherAuthorId,
        ),
      ]);
    recipes = {
      pastaTomato,
      tomatoSoup,
      greenPasta,
      salad,
      otherAuthorRecipe,
    };
  };

  const responseIds = (body: PaginatedRecipesResponseDto): Set<string> =>
    new Set(body.recipes.map(({ id }) => id));

  beforeAll(async () => {
    await prisma.$connect();
    await resetTestDatabase(prisma);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
    await createDefaultTestUser(prisma);
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
      new Set([
        recipes.pastaTomato,
        recipes.greenPasta,
        recipes.otherAuthorRecipe,
      ]),
    );
    expect(body.pagination.total).toBe(3);
  });

  it('filters recipes by one ingredient', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes?ingredient=${tomatoId}`)
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(
      new Set([
        recipes.pastaTomato,
        recipes.tomatoSoup,
        recipes.otherAuthorRecipe,
      ]),
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
      new Set([
        recipes.pastaTomato,
        recipes.greenPasta,
        recipes.otherAuthorRecipe,
      ]),
    );
  });

  it('filters recipes by difficulty', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes?difficulty=${RecipeDifficulty.FACIL}`)
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(
      new Set([
        recipes.pastaTomato,
        recipes.tomatoSoup,
        recipes.salad,
        recipes.otherAuthorRecipe,
      ]),
    );
  });

  it('filters recipes by authorId', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(`/recipes?authorId=${otherAuthorId}`)
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(new Set([recipes.otherAuthorRecipe]));
    expect(body.pagination.total).toBe(1);
  });

  it('combines authorId with other filters', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(
        `/recipes?authorId=${otherAuthorId}&category=${RecipeCategory.ALMUERZO}`,
      )
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(new Set([recipes.otherAuthorRecipe]));
  });

  it('returns 400 when authorId is not a UUID', async () => {
    await request(app.getHttpServer() as Server)
      .get('/recipes?authorId=not-a-uuid')
      .expect(400);
  });

  it('filters recipes by a partial case-insensitive author name', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/recipes?author=camila')
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(new Set([recipes.otherAuthorRecipe]));
  });

  it('does not filter by author when the value is an empty string', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/recipes?author=')
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(body.pagination.total).toBe(5);
  });

  it('combines author with other filters', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(
        `/recipes?author=camila&category=${RecipeCategory.ALMUERZO}&difficulty=${RecipeDifficulty.FACIL}`,
      )
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(new Set([recipes.otherAuthorRecipe]));
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
      total: 5,
      page: 1,
      limit: 2,
      totalPages: 3,
    });
  });
});
