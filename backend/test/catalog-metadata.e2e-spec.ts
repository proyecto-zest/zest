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

import {
  loadIngredientNames,
  seedIngredients,
  stableIngredientId,
} from '../prisma/seed';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { RecipeMetadataResponseDto } from '../src/recipes/dto/recipe-response.dto';
import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

type IngredientResponse = {
  id: string;
  name: string;
};

describeWithDatabase('Catalog and recipe metadata endpoints (e2e)', () => {
  const prisma = new PrismaClient();
  let app: INestApplication;

  beforeAll(async () => {
    await prisma.$connect();
    await resetTestDatabase(prisma);
    await seedIngredients(prisma);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('GET /ingredients returns the complete English catalog', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/ingredients')
      .expect(200);
    const ingredients = response.body as IngredientResponse[];

    expect(ingredients).toHaveLength(360);
    expect(new Set(ingredients.map(({ name }) => name))).toEqual(
      new Set(loadIngredientNames()),
    );
    expect(new Set(ingredients.map(({ id }) => id))).toEqual(
      new Set(loadIngredientNames().map(stableIngredientId)),
    );
    for (const ingredient of ingredients) {
      expect(Object.keys(ingredient).sort()).toEqual(['id', 'name']);
      expect(typeof ingredient.id).toBe('string');
      expect(typeof ingredient.name).toBe('string');
      expect(ingredient.name).toBe(ingredient.name.toLocaleLowerCase('en'));
    }
  });

  it('GET /recipes/metadata returns all selector enum values', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/recipes/metadata')
      .expect(200);
    const metadata = response.body as RecipeMetadataResponseDto;

    expect(metadata).toEqual({
      categories: Object.values(RecipeCategory),
      difficulties: Object.values(RecipeDifficulty),
      units: Object.values(IngredientUnit),
      timeUnits: Object.values(RecipeTimeUnit),
    });
    expect(metadata.categories).not.toHaveLength(0);
    expect(metadata.difficulties).not.toHaveLength(0);
    expect(metadata.units).not.toHaveLength(0);
    expect(metadata.timeUnits).not.toHaveLength(0);
  });
});
