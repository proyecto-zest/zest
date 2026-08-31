import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

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
});
