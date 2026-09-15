import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import {
  IngredientUnit,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

import { CreateRecipeDto } from './create-recipe.dto';
import { UpdateRecipeDto } from './update-recipe.dto';

const validRecipe = {
  title: 'Recipe',
  description: 'Recipe description',
  category: RecipeCategory.ALMUERZO,
  time: 30,
  timeUnit: RecipeTimeUnit.MINUTOS,
  difficulty: RecipeDifficulty.FACIL,
  servings: 2,
  ingredients: [
    {
      ingredientId: '11111111-1111-4111-8111-111111111111',
      amount: '1',
      unit: IngredientUnit.UNIDAD,
    },
  ],
  steps: ['Prepare the ingredients.'],
};

type RecipeDtoClass = typeof CreateRecipeDto | typeof UpdateRecipeDto;

const validateRecipe = (
  dtoClass: RecipeDtoClass,
  overrides: Partial<CreateRecipeDto> = {},
): Promise<ValidationError[]> =>
  validate(plainToInstance(dtoClass, { ...validRecipe, ...overrides }));

const messagesFrom = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => Object.values(error.constraints ?? {}));

describe('CreateRecipeDto limits', () => {
  it.each([
    ['title', { title: 'a'.repeat(100) }],
    ['description', { description: 'a'.repeat(500) }],
    ['step', { steps: ['a'.repeat(500)] }],
    ['servings', { servings: 100 }],
  ])('accepts the valid %s boundary', async (_field, overrides) => {
    await expect(validateRecipe(CreateRecipeDto, overrides)).resolves.toEqual(
      [],
    );
  });

  it.each([
    ['title', { title: 'a'.repeat(101) }, 'title'],
    ['description', { description: 'a'.repeat(501) }, 'description'],
    ['step', { steps: ['a'.repeat(501)] }, 'steps'],
    ['servings', { servings: 101 }, 'servings'],
  ])(
    'rejects %s above its maximum',
    async (_field, overrides, expectedProperty) => {
      const errors = await validateRecipe(CreateRecipeDto, overrides);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: expectedProperty }),
        ]),
      );
    },
  );

  it.each([
    [RecipeTimeUnit.MINUTOS, 59],
    [RecipeTimeUnit.HORAS, 23],
    [RecipeTimeUnit.MINUTOS, 23],
  ])('accepts time %s at the valid boundary %i', async (timeUnit, time) => {
    await expect(
      validateRecipe(CreateRecipeDto, { time, timeUnit }),
    ).resolves.toEqual([]);
  });

  it.each([
    [
      RecipeTimeUnit.MINUTOS,
      60,
      'time must not be greater than 59 when timeUnit is MINUTOS',
    ],
    [
      RecipeTimeUnit.HORAS,
      24,
      'time must not be greater than 23 when timeUnit is HORAS',
    ],
    [
      RecipeTimeUnit.HORAS,
      59,
      'time must not be greater than 23 when timeUnit is HORAS',
    ],
  ])(
    'rejects time %s above its allowed range',
    async (timeUnit, time, expectedMessage) => {
      const errors = await validateRecipe(CreateRecipeDto, { time, timeUnit });

      expect(messagesFrom(errors)).toContain(expectedMessage);
    },
  );

  it('applies the inherited limits to UpdateRecipeDto', async () => {
    const errors = await validateRecipe(UpdateRecipeDto, {
      title: 'a'.repeat(101),
      servings: 101,
      time: 24,
      timeUnit: RecipeTimeUnit.HORAS,
    });

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['title', 'servings', 'time']),
    );
  });
});
