import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  IngredientUnit,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

export class CreateRecipeIngredientDto {
  @IsUUID()
  ingredientId!: string;

  @IsString()
  @IsNotEmpty()
  amount!: string;

  @IsEnum(IngredientUnit)
  unit!: IngredientUnit;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(RecipeCategory)
  category!: RecipeCategory;

  @IsInt()
  @Min(1)
  time!: number;

  @IsEnum(RecipeTimeUnit)
  timeUnit!: RecipeTimeUnit;

  @IsEnum(RecipeDifficulty)
  difficulty!: RecipeDifficulty;

  @IsInt()
  @Min(1)
  servings!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^recipes\/.+/)
  imageKey!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  @ArrayUnique(
    (ingredient: CreateRecipeIngredientDto) => ingredient.ingredientId,
  )
  ingredients!: CreateRecipeIngredientDto[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  steps!: string[];
}
