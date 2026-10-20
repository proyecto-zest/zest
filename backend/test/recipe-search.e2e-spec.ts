import { INestApplication } from '@nestjs/common';
import {
  IngredientUnit,
  Prisma,
  PrismaClient,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { configureApp } from '../src/configure-app';
import { PaginatedRecipesResponseDto } from '../src/recipes/dto/recipe-response.dto';
import { DEFAULT_RECIPE_AUTHOR_ID } from '../src/recipes/recipes.constants';
import { resetTestDatabase } from './test-database';
import { createDefaultTestUser } from './test-users';
import { PrismaService } from '../src/prisma/prisma.service';
import { RecipesService } from '../src/recipes/recipes.service';
import { StorageService } from '../src/storage/storage.service';

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

  it('filters recipes by a partial case-insensitive ingredient name', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/recipes?ingredientName=TOMATO')
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

  it('combines ingredientName with other filters', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get(
        `/recipes?ingredientName=cheese&difficulty=${RecipeDifficulty.MEDIA}`,
      )
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(responseIds(body)).toEqual(new Set([recipes.greenPasta]));
  });

  it('does not filter by ingredientName when the value is empty', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/recipes?ingredientName=')
      .expect(200);
    const body = response.body as PaginatedRecipesResponseDto;

    expect(body.pagination.total).toBe(5);
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

  describe('accent-insensitive search (ZEST-114)', () => {
    it('keeps the count and cards on one snapshot during a concurrent deletion', async () => {
      // Delete from a separate connection exactly between the search and the
      // card read. The real service must still return its original snapshot.
      const db = {
        $transaction: (
          operation: (tx: Prisma.TransactionClient) => Promise<unknown>,
          options: { isolationLevel: Prisma.TransactionIsolationLevel },
        ) =>
          prisma.$transaction(async (tx) => {
            const intercepted = new Proxy(tx, {
              get(target, key) {
                if (key === '$queryRaw') {
                  return async (query: Prisma.Sql) => {
                    const result = await tx.$queryRaw(query);
                    await prisma.$transaction([
                      prisma.recipeIngredient.deleteMany({
                        where: { recipeId: recipes.pastaTomato },
                      }),
                      prisma.recipe.delete({
                        where: { id: recipes.pastaTomato },
                      }),
                    ]);
                    return result;
                  };
                }
                return Reflect.get(target, key) as unknown;
              },
            });
            return operation(intercepted);
          }, options),
      } as unknown as PrismaService;
      const service = new RecipesService(db, app.get(StorageService));
      const result = await service.findAll({
        name: 'pasta',
        page: 1,
        limit: 20,
      });
      expect(result.pagination.total).toBe(3);
      expect(responseIds(result)).toEqual(
        new Set([
          recipes.pastaTomato,
          recipes.greenPasta,
          recipes.otherAuthorRecipe,
        ]),
      );
      expect(
        await prisma.recipe.findUnique({ where: { id: recipes.pastaTomato } }),
      ).toBeNull();
    });

    it('uses the same unaccent dictionary as the frontend ingredient picker', async () => {
      const rules = JSON.parse(
        readFileSync(
          resolve(__dirname, '../../frontend/src/lib/search/unaccent.json'),
          'utf8',
        ),
      ) as Record<string, string>;
      const rows = await prisma.$queryRaw<
        Array<{ original: string; normalized: string }>
      >`
        SELECT original, public.search_unaccent(original) AS normalized
        FROM unnest(${Object.keys(rules)}::text[]) AS original
      `;
      for (const { original, normalized } of rows) {
        expect({ original, normalized }).toEqual({
          original,
          normalized: rules[original],
        });
      }
    });

    it.each(['name', 'ingredientName', 'author'])(
      'matches LIKE metacharacters literally in %s',
      async (field) => {
        const literal = '100%_\\!％';
        const ingredient = await prisma.ingredient.create({
          data: { name: literal },
        });
        const user = await prisma.user.create({
          data: {
            auth0Sub: `auth0|${randomUUID()}`,
            email: `${randomUUID()}@zest.test`,
            name: literal,
          },
        });
        const id = await createRecipe(
          literal,
          RecipeCategory.CENA,
          RecipeDifficulty.FACIL,
          [ingredient.id],
          user.id,
        );
        for (const query of ['%', '_', '\\', '!', '％', literal]) {
          const response = await request(app.getHttpServer() as Server)
            .get('/recipes')
            .query({ [field]: query })
            .expect(200);
          expect(
            responseIds(response.body as PaginatedRecipesResponseDto),
          ).toEqual(new Set([id]));
        }
      },
    );

    const cases = [
      {
        field: 'name',
        stored: [
          'Pollo al horno con puré de limón',
          'Pollo al horno con pure de limon',
        ],
        queries: ['puré de limón', 'pure de limon', 'PURÉ DE LIMÓN'],
      },
      {
        field: 'ingredientName',
        stored: ['ají amarillo', 'aji amarillo'],
        queries: ['ají', 'aji', 'AJÍ'],
      },
      {
        field: 'author',
        stored: ['Inés Muñoz', 'Ines Munoz'],
        queries: ['inés muñoz', 'ines munoz', 'INÉS MUÑOZ'],
      },
      {
        field: 'name',
        stored: ['Piña asada', 'Pina asada'],
        queries: ['piña', 'pina', 'PIÑA'],
      },
      {
        field: 'ingredientName',
        stored: ['piñón', 'pinon'],
        queries: ['piñón', 'pinon', 'PIÑÓN'],
      },
    ];

    it.each(cases)(
      'matches accented and plain $field values: $stored',
      async ({ field, stored, queries }) => {
        const expectedIds: string[] = [];
        for (const value of stored) {
          let authorId = DEFAULT_RECIPE_AUTHOR_ID;
          let ingredientIds = [tomatoId];
          if (field === 'author') {
            const user = await prisma.user.create({
              data: {
                auth0Sub: `auth0|${randomUUID()}`,
                email: `${randomUUID()}@zest.test`,
                name: value,
              },
            });
            authorId = user.id;
          }
          if (field === 'ingredientName') {
            const ingredient = await prisma.ingredient.create({
              data: { name: value },
            });
            ingredientIds = [ingredient.id];
          }
          expectedIds.push(
            await createRecipe(
              field === 'name' ? value : 'Accent search recipe',
              RecipeCategory.ALMUERZO,
              RecipeDifficulty.FACIL,
              ingredientIds,
              authorId,
            ),
          );
        }

        // NFD covers text entered with decomposed combining accents too.
        for (const value of [...queries, queries[0].normalize('NFD')]) {
          const response = await request(app.getHttpServer() as Server)
            .get('/recipes')
            .query({ [field]: value })
            .expect(200);
          const body = response.body as PaginatedRecipesResponseDto;
          expect(responseIds(body)).toEqual(new Set(expectedIds));
          expect(body.pagination.total).toBe(2);
        }
      },
    );

    it('combines normalized text with every existing filter and paginates matches', async () => {
      await prisma.user.update({
        where: { id: otherAuthorId },
        data: { name: 'Inés Muñoz' },
      });
      const chili = await prisma.ingredient.create({
        data: { name: 'ají amarillo' },
      });
      const createdIds: string[] = [];
      for (let index = 0; index < 3; index++) {
        const id = await createRecipe(
          `Pollo con puré ${index}`,
          RecipeCategory.CENA,
          RecipeDifficulty.MEDIA,
          [chili.id, tomatoId],
          otherAuthorId,
        );
        await prisma.recipe.update({
          where: { id },
          data: { createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)) },
        });
        createdIds.push(id);
      }
      const filters = {
        name: 'PURE',
        author: 'INES MUNOZ',
        ingredientName: 'AJI',
        ingredient: [chili.id, tomatoId],
        category: RecipeCategory.CENA,
        difficulty: RecipeDifficulty.MEDIA,
        authorId: otherAuthorId,
        limit: 2,
      };
      const pages: PaginatedRecipesResponseDto[] = [];
      for (const page of [1, 2, 3]) {
        const response = await request(app.getHttpServer() as Server)
          .get('/recipes')
          .query({ ...filters, page })
          .expect(200);
        const body = response.body as PaginatedRecipesResponseDto;
        expect(body.pagination).toEqual({
          total: 3,
          page,
          limit: 2,
          totalPages: 2,
        });
        pages.push(body);
      }
      expect(
        pages.flatMap(({ recipes }) => recipes.map(({ id }) => id)),
      ).toEqual([...createdIds].reverse());
      expect(pages[2].recipes).toEqual([]);

      const response = await request(app.getHttpServer() as Server)
        .get('/recipes')
        .query({ ...filters, difficulty: RecipeDifficulty.DIFICIL })
        .expect(200);
      expect(
        (response.body as PaginatedRecipesResponseDto).pagination.total,
      ).toBe(0);
    });

    it.each(['name', 'ingredientName', 'author'])(
      'treats quotes and SQL-like input as text in %s',
      async (field) => {
        const response = await request(app.getHttpServer() as Server)
          .get('/recipes')
          .query({ [field]: "' OR TRUE --" })
          .expect(200);
        const body = response.body as PaginatedRecipesResponseDto;
        expect(body.recipes).toEqual([]);
        expect(body.pagination.total).toBe(0);
      },
    );
  });
});
