import {
  IngredientUnit,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

export class RecipeIngredientCatalogResponseDto {
  id!: string;
  name!: string;
}

export class RecipeIngredientResponseDto {
  recipeId!: string;
  ingredientId!: string;
  amount!: string;
  unit!: IngredientUnit;
  ingredient!: RecipeIngredientCatalogResponseDto;
}

export class RecipeStepResponseDto {
  id!: string;
  recipeId!: string;
  stepNumber!: number;
  text!: string;
}

export class RecipeBaseResponseDto {
  id!: string;
  authorId!: string | null;
  title!: string;
  description!: string;
  category!: RecipeCategory;
  time!: number;
  timeUnit!: RecipeTimeUnit;
  difficulty!: RecipeDifficulty;
  servings!: number;
}

export class CreatedRecipeResponseDto extends RecipeBaseResponseDto {
  ingredients!: RecipeIngredientResponseDto[];
  steps!: RecipeStepResponseDto[];
  imageUrl!: string;
}

export class RecipeMetadataResponseDto {
  categories!: RecipeCategory[];
  difficulties!: RecipeDifficulty[];
  units!: IngredientUnit[];
  timeUnits!: RecipeTimeUnit[];
}

export class RecipeCardResponseDto {
  id!: string;
  title!: string;
  imageUrl!: string;
  category!: RecipeCategory;
  difficulty!: RecipeDifficulty;
  time!: number;
  servings!: number;
}

export class RecipePaginationResponseDto {
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

export class PaginatedRecipesResponseDto {
  recipes!: RecipeCardResponseDto[];
  pagination!: RecipePaginationResponseDto;
}

export class RecipeDetailResponseDto extends RecipeBaseResponseDto {
  ingredients!: RecipeIngredientResponseDto[];
  steps!: RecipeStepResponseDto[];
  imageUrls!: string[];
}
