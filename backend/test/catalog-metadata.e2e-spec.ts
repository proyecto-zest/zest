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

import { loadIngredientNames, seedIngredients } from '../prisma/seed';
import { AppModule } from '../src/app.module';
import { RecipeMetadata } from '../src/recipes/recipes.service';

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
    await seedIngredients(prisma);

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('GET /ingredients returns all 213 catalog entries with id and name', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/ingredients')
      .expect(200);
    const ingredients = response.body as IngredientResponse[];

    expect(ingredients).toHaveLength(213);
    expect(new Set(ingredients.map(({ name }) => name))).toEqual(
      new Set(loadIngredientNames()),
    );
    for (const ingredient of ingredients) {
      expect(Object.keys(ingredient).sort()).toEqual(['id', 'name']);
      expect(typeof ingredient.id).toBe('string');
      expect(typeof ingredient.name).toBe('string');
    }
  });

  it('GET /recipes/metadata returns all selector enum values', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/recipes/metadata')
      .expect(200);
    const metadata = response.body as RecipeMetadata;

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
