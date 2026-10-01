import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ListCollectionsQueryDto } from './list-collections-query.dto';

describe('ListCollectionsQueryDto', () => {
  it('accepts an empty query', async () => {
    const dto = plainToInstance(ListCollectionsQueryDto, {});

    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts a valid recipeId', async () => {
    const dto = plainToInstance(ListCollectionsQueryDto, {
      recipeId: '11111111-1111-4111-8111-111111111111',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects a recipeId that is not a UUID', async () => {
    const dto = plainToInstance(ListCollectionsQueryDto, {
      recipeId: 'not-a-uuid',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
