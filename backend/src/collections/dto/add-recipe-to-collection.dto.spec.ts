import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { AddRecipeToCollectionDto } from './add-recipe-to-collection.dto';

describe('AddRecipeToCollectionDto', () => {
  it('accepts a recipe UUID', async () => {
    const dto = plainToInstance(AddRecipeToCollectionDto, {
      recipeId: '33333333-3333-4333-8333-333333333333',
    });

    expect(await validate(dto)).toHaveLength(0);
  });

  it.each([{}, { recipeId: 'not-a-uuid' }, { recipeId: '' }])(
    'rejects %o',
    async (payload) => {
      const dto = plainToInstance(AddRecipeToCollectionDto, payload);

      expect(await validate(dto)).not.toHaveLength(0);
    },
  );
});
