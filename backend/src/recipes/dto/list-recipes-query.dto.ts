import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { RecipeCategory, RecipeDifficulty } from '@prisma/client';

import {
  DEFAULT_RECIPES_LIMIT,
  DEFAULT_RECIPES_PAGE,
} from '../recipes.constants';

export class ListRecipesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_RECIPES_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = DEFAULT_RECIPES_LIMIT;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown[] =>
    Array.isArray(value) ? value : [value],
  )
  @IsUUID('4', { each: true })
  ingredient?: string[];

  @IsOptional()
  @IsEnum(RecipeCategory)
  category?: RecipeCategory;

  @IsOptional()
  @IsEnum(RecipeDifficulty)
  difficulty?: RecipeDifficulty;
}
