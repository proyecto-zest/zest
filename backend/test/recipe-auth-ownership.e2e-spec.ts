import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  IngredientUnit,
  PrismaClient,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { configureApp } from '../src/configure-app';
import { PrismaModule } from '../src/prisma/prisma.module';
import { RecipesModule } from '../src/recipes/recipes.module';
import { StorageService } from '../src/storage/storage.service';
import { authTestConfigModuleOptions } from './auth-test-helper';
import {
  withAuthenticatedUser,
  withRejectedAuthentication,
} from './protected-route-test-helper';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('Recipe endpoint auth & ownership (e2e)', () => {
  const prisma = new PrismaClient();
  const ownerSub = 'auth0|zest-recipe-owner';
  const otherUserSub = 'auth0|zest-recipe-other-user';
  const objectExists = jest.fn().mockResolvedValue(true);
  const deleteObject = jest.fn().mockResolvedValue(undefined);
  const getSignedReadUrl = jest.fn((key: string) =>
    Promise.resolve(`https://signed.test/${key}`),
  );
  const getSignedUploadUrl = jest.fn().mockResolvedValue('https://upload.test');

  async function buildApp(): Promise<INestApplication> {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(authTestConfigModuleOptions()),
        PrismaModule,
        AuthModule,
        RecipesModule,
      ],
    })
      .overrideProvider(StorageService)
      .useValue({
        objectExists,
        deleteObject,
        getSignedReadUrl,
        getSignedUploadUrl,
      })
      .compile();

    const app = moduleFixture.createNestApplication();
    configureApp(app);

    return app;
  }

  async function createOwnerAndOtherUser(): Promise<{
    owner: { id: string };
    otherUser: { id: string };
  }> {
    const [owner, otherUser] = await Promise.all([
      prisma.user.create({
        data: {
          auth0Sub: ownerSub,
          email: 'owner@zest.test',
          name: 'Recipe Owner',
          emailVerified: true,
        },
      }),
      prisma.user.create({
        data: {
          auth0Sub: otherUserSub,
          email: 'other@zest.test',
          name: 'Other User',
          emailVerified: true,
        },
      }),
    ]);

    return { owner, otherUser };
  }

  async function createExistingRecipe(ownerId: string) {
    const ingredient = await prisma.ingredient.create({
      data: { name: `ownership-test-ingredient-${randomUUID()}` },
    });

    return prisma.recipe.create({
      data: {
        authorId: ownerId,
        title: 'Receta existente',
        description: 'Descripción original.',
        category: RecipeCategory.ALMUERZO,
        time: 20,
        timeUnit: RecipeTimeUnit.MINUTOS,
        difficulty: RecipeDifficulty.FACIL,
        servings: 2,
        ingredients: {
          create: {
            ingredientId: ingredient.id,
            amount: '1',
            unit: IngredientUnit.UNIDAD,
          },
        },
        steps: { create: { stepNumber: 1, text: 'Paso original.' } },
      },
    });
  }

  function validRecipePayload(ingredientId: string) {
    return {
      title: 'Receta nueva',
      description: 'Descripción nueva.',
      category: RecipeCategory.ALMUERZO,
      time: 20,
      timeUnit: RecipeTimeUnit.MINUTOS,
      difficulty: RecipeDifficulty.FACIL,
      servings: 2,
      ingredients: [{ ingredientId, amount: '1', unit: IngredientUnit.UNIDAD }],
      steps: ['Un paso.'],
    };
  }

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    objectExists.mockResolvedValue(true);
    await resetTestDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 401 for GET /recipes without a token', async () => {
    const app = await buildApp();
    withRejectedAuthentication(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .get('/recipes')
      .expect(401);

    await app.close();
  });

  it('returns 401 for GET /recipes/:id without a token', async () => {
    await createOwnerAndOtherUser();
    const app = await buildApp();
    withRejectedAuthentication(app);
    await app.init();

    await request(app.getHttpServer() as Server)
      .get(`/recipes/${randomUUID()}`)
      .expect(401);

    await app.close();
  });

  it('creates a recipe with the authenticated user as author', async () => {
    const { owner } = await createOwnerAndOtherUser();
    const ingredient = await prisma.ingredient.create({
      data: { name: `create-auth-ingredient-${randomUUID()}` },
    });
    const app = await buildApp();
    withAuthenticatedUser(app, { sub: ownerSub });
    await app.init();

    const response = await request(app.getHttpServer() as Server)
      .post('/recipes')
      .send(validRecipePayload(ingredient.id))
      .expect(201);

    expect(response.body).toMatchObject({ authorId: owner.id });

    await app.close();
  });

  it('lets the author update their own recipe', async () => {
    const { owner } = await createOwnerAndOtherUser();
    const recipe = await createExistingRecipe(owner.id);
    const existingIngredient = await prisma.recipeIngredient.findFirstOrThrow({
      where: { recipeId: recipe.id },
    });
    const app = await buildApp();
    withAuthenticatedUser(app, { sub: ownerSub });
    await app.init();

    await request(app.getHttpServer() as Server)
      .put(`/recipes/${recipe.id}`)
      .send({
        ...validRecipePayload(existingIngredient.ingredientId),
        ingredients: [
          {
            ingredientId: existingIngredient.ingredientId,
            amount: '2',
            unit: IngredientUnit.UNIDAD,
          },
        ],
      })
      .expect(200);

    await app.close();
  });

  it("returns 403 when a different user tries to update someone else's recipe", async () => {
    const { owner } = await createOwnerAndOtherUser();
    const recipe = await createExistingRecipe(owner.id);
    const existingIngredient = await prisma.recipeIngredient.findFirstOrThrow({
      where: { recipeId: recipe.id },
    });
    const app = await buildApp();
    withAuthenticatedUser(app, { sub: otherUserSub });
    await app.init();

    await request(app.getHttpServer() as Server)
      .put(`/recipes/${recipe.id}`)
      .send({
        ...validRecipePayload(existingIngredient.ingredientId),
        ingredients: [
          {
            ingredientId: existingIngredient.ingredientId,
            amount: '2',
            unit: IngredientUnit.UNIDAD,
          },
        ],
      })
      .expect(403);

    await expect(
      prisma.recipe.findUniqueOrThrow({ where: { id: recipe.id } }),
    ).resolves.toMatchObject({ title: 'Receta existente' });

    await app.close();
  });

  it('returns 404 when updating a recipe that does not exist', async () => {
    await createOwnerAndOtherUser();
    const app = await buildApp();
    withAuthenticatedUser(app, { sub: ownerSub });
    await app.init();

    const ingredient = await prisma.ingredient.create({
      data: { name: `update-404-ingredient-${randomUUID()}` },
    });

    await request(app.getHttpServer() as Server)
      .put(`/recipes/${randomUUID()}`)
      .send(validRecipePayload(ingredient.id))
      .expect(404);

    await app.close();
  });

  it('lets the author delete their own recipe', async () => {
    const { owner } = await createOwnerAndOtherUser();
    const recipe = await createExistingRecipe(owner.id);
    const app = await buildApp();
    withAuthenticatedUser(app, { sub: ownerSub });
    await app.init();

    await request(app.getHttpServer() as Server)
      .delete(`/recipes/${recipe.id}`)
      .expect(204);

    await expect(
      prisma.recipe.findUnique({ where: { id: recipe.id } }),
    ).resolves.toBeNull();

    await app.close();
  });

  it("returns 403 when a different user tries to delete someone else's recipe", async () => {
    const { owner } = await createOwnerAndOtherUser();
    const recipe = await createExistingRecipe(owner.id);
    const app = await buildApp();
    withAuthenticatedUser(app, { sub: otherUserSub });
    await app.init();

    await request(app.getHttpServer() as Server)
      .delete(`/recipes/${recipe.id}`)
      .expect(403);

    await expect(
      prisma.recipe.findUnique({ where: { id: recipe.id } }),
    ).resolves.not.toBeNull();

    await app.close();
  });

  it('returns 404 when deleting a recipe that does not exist', async () => {
    await createOwnerAndOtherUser();
    const app = await buildApp();
    withAuthenticatedUser(app, { sub: ownerSub });
    await app.init();

    await request(app.getHttpServer() as Server)
      .delete(`/recipes/${randomUUID()}`)
      .expect(404);

    await app.close();
  });
});
