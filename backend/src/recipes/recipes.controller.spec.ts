import {
  IngredientUnit,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import {
  CreatedRecipeResponseDto,
  PaginatedRecipesResponseDto,
  RecipeDetailResponseDto,
  RecipeMetadataResponseDto,
} from './dto/recipe-response.dto';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

describe('RecipesController', () => {
  it('delegates recipe detail retrieval to the service', async () => {
    const recipeId = '33333333-3333-4333-8333-333333333333';
    const recipe = { id: recipeId } as RecipeDetailResponseDto;
    const findOne = jest.fn().mockResolvedValue(recipe);
    const controller = new RecipesController({
      findOne,
    } as unknown as RecipesService);

    await expect(controller.findOne(recipeId)).resolves.toBe(recipe);
    expect(findOne).toHaveBeenCalledWith(recipeId);
  });

  it('delegates the paginated recipe listing to the service', async () => {
    const query: ListRecipesQueryDto = { page: 1, limit: 20 };
    const result: PaginatedRecipesResponseDto = {
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
    const metadata: RecipeMetadataResponseDto = {
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
      imageKey: 'recipes/image.webp',
      ingredients: [
        {
          ingredientId: '11111111-1111-4111-8111-111111111111',
          amount: '2',
          unit: IngredientUnit.UNIDAD,
        },
      ],
      steps: ['Cortar el tomate.'],
    };
    const createdRecipe = { id: 'recipe-id' } as CreatedRecipeResponseDto;
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

  it('delegates an image update to the service', async () => {
    const recipeId = '33333333-3333-4333-8333-333333333333';
    const dto = { imageKey: 'recipes/new.webp' };
    const recipe = { id: recipeId } as RecipeDetailResponseDto;
    const updateImage = jest.fn().mockResolvedValue(recipe);
    const controller = new RecipesController({
      updateImage,
    } as unknown as RecipesService);

    await expect(controller.updateImage(recipeId, dto)).resolves.toBe(recipe);
    expect(updateImage).toHaveBeenCalledWith(recipeId, dto);
  });

  it('delegates recipe deletion to the service', async () => {
    const recipeId = '33333333-3333-4333-8333-333333333333';
    const remove = jest.fn().mockResolvedValue(undefined);
    const controller = new RecipesController({
      remove,
    } as unknown as RecipesService);

    await expect(controller.remove(recipeId)).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith(recipeId);
  });
});
