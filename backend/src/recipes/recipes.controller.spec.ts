import {
  IngredientUnit,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import { RecipesController } from './recipes.controller';
import {
  CreatedRecipe,
  PaginatedRecipes,
  RecipeMetadata,
  RecipesService,
} from './recipes.service';

describe('RecipesController', () => {
  it('delegates the paginated recipe listing to the service', async () => {
    const query: ListRecipesQueryDto = { page: 1, limit: 20 };
    const result: PaginatedRecipes = {
      recipes: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
    const findAll = jest.fn().mockResolvedValue(result);
    const controller = new RecipesController({
      findAll,
    } as unknown as RecipesService);

    await expect(controller.findAll(query)).resolves.toBe(result);
    expect(findAll).toHaveBeenCalledWith(query);
  });

  it('returns recipe metadata from the service', () => {
    const metadata: RecipeMetadata = {
      categories: Object.values(RecipeCategory),
      difficulties: Object.values(RecipeDifficulty),
      units: Object.values(IngredientUnit),
      timeUnits: Object.values(RecipeTimeUnit),
    };
    const getMetadata = jest.fn().mockReturnValue(metadata);
    const controller = new RecipesController({
      getMetadata,
    } as unknown as RecipesService);

    expect(controller.getMetadata()).toBe(metadata);
    expect(getMetadata).toHaveBeenCalledTimes(1);
  });

  it('delegates recipe creation to the service', async () => {
    const createRecipeDto: CreateRecipeDto = {
      title: 'Ensalada de tomate',
      description: 'Una ensalada fresca.',
      category: RecipeCategory.ENTRADA,
      time: 10,
      timeUnit: RecipeTimeUnit.MINUTOS,
      difficulty: RecipeDifficulty.FACIL,
      servings: 2,
      ingredients: [
        {
          ingredientId: '11111111-1111-4111-8111-111111111111',
          amount: '2',
          unit: IngredientUnit.UNIDAD,
        },
      ],
      steps: ['Cortar el tomate.'],
    };
    const createdRecipe = { id: 'recipe-id' } as CreatedRecipe;
    const create = jest.fn().mockResolvedValue(createdRecipe);
    const recipesService = {
      create,
    } as unknown as RecipesService;
    const controller = new RecipesController(recipesService);

    await expect(controller.create(createRecipeDto)).resolves.toBe(
      createdRecipe,
    );
    expect(create).toHaveBeenCalledWith(createRecipeDto);
  });
});
