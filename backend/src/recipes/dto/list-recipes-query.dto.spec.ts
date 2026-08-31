import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RecipeCategory, RecipeDifficulty } from '@prisma/client';

import {
  DEFAULT_RECIPES_LIMIT,
  DEFAULT_RECIPES_PAGE,
} from '../recipes.constants';
import { ListRecipesQueryDto } from './list-recipes-query.dto';

describe('ListRecipesQueryDto', () => {
  it('uses the pagination defaults when params are omitted', async () => {
    const query = plainToInstance(ListRecipesQueryDto, {});

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query).toEqual({
      page: DEFAULT_RECIPES_PAGE,
      limit: DEFAULT_RECIPES_LIMIT,
    });
  });

  it('transforms valid query params to numbers', async () => {
    const query = plainToInstance(ListRecipesQueryDto, {
      page: '2',
      limit: '10',
    });

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query).toEqual({ page: 2, limit: 10 });
  });

  it('transforms one or more ingredient ids into an array', async () => {
    const firstIngredientId = '11111111-1111-4111-8111-111111111111';
    const secondIngredientId = '22222222-2222-4222-8222-222222222222';
    const singleIngredientQuery = plainToInstance(ListRecipesQueryDto, {
      ingredient: firstIngredientId,
    });
    const multipleIngredientsQuery = plainToInstance(ListRecipesQueryDto, {
      ingredient: [firstIngredientId, secondIngredientId],
    });

    await expect(validate(singleIngredientQuery)).resolves.toHaveLength(0);
    await expect(validate(multipleIngredientsQuery)).resolves.toHaveLength(0);
    expect(singleIngredientQuery.ingredient).toEqual([firstIngredientId]);
    expect(multipleIngredientsQuery.ingredient).toEqual([
      firstIngredientId,
      secondIngredientId,
    ]);
  });

  it('accepts valid recipe search filters', async () => {
    const query = plainToInstance(ListRecipesQueryDto, {
      name: 'pasta',
      category: RecipeCategory.ALMUERZO,
      difficulty: RecipeDifficulty.FACIL,
    });

    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it.each([
    { page: '0' },
    { page: '-1' },
    { page: '1.5' },
    { page: 'invalid' },
    { limit: '0' },
    { limit: '-1' },
    { limit: '1.5' },
    { limit: 'invalid' },
  ])('rejects invalid pagination params: %o', async (params) => {
    const query = plainToInstance(ListRecipesQueryDto, params);

    await expect(validate(query)).resolves.not.toHaveLength(0);
  });

  it.each([
    { ingredient: 'not-a-uuid' },
    { category: 'INVALID_CATEGORY' },
    { difficulty: 'INVALID_DIFFICULTY' },
  ])('rejects invalid recipe filters: %o', async (params) => {
    const query = plainToInstance(ListRecipesQueryDto, params);

    await expect(validate(query)).resolves.not.toHaveLength(0);
  });
});
