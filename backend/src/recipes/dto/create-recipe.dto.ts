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
  Min,
  ValidateNested,
} from 'class-validator';
import { RecipeCategory } from '@prisma/client';

export class CreateRecipeIngredientDto {
  @IsUUID()
  ingredientId!: string;

  @IsString()
  @IsNotEmpty()
  amount!: string;
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

  @IsString()
  @IsNotEmpty()
  difficulty!: string;

  @IsInt()
  @Min(1)
  servings!: number;

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
