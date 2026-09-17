import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidateNested,
} from 'class-validator';
import {
  IngredientUnit,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';

@ValidatorConstraint({ name: 'recipeTimeRange', async: false })
class RecipeTimeRangeConstraint implements ValidatorConstraintInterface {
  validate(time: unknown, { object }: ValidationArguments): boolean {
    if (typeof time !== 'number') {
      return true;
    }

    const { timeUnit } = object as CreateRecipeDto;
    const maximum =
      timeUnit === RecipeTimeUnit.MINUTOS
        ? 59
        : timeUnit === RecipeTimeUnit.HORAS
          ? 23
          : undefined;

    return maximum === undefined || time <= maximum;
  }

  defaultMessage({ object }: ValidationArguments): string {
    const { timeUnit } = object as CreateRecipeDto;
    const maximum = timeUnit === RecipeTimeUnit.MINUTOS ? 59 : 23;

    return `time must not be greater than ${maximum} when timeUnit is ${timeUnit}`;
  }
}

export class CreateRecipeIngredientDto {
  @IsUUID()
  ingredientId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  amount!: string;

  @IsEnum(IngredientUnit)
  unit!: IngredientUnit;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsEnum(RecipeCategory)
  category!: RecipeCategory;

  @IsInt()
  @Min(1)
  @ValidateIf(
    (recipe: CreateRecipeDto) =>
      recipe.timeUnit === RecipeTimeUnit.MINUTOS ||
      recipe.timeUnit === RecipeTimeUnit.HORAS,
  )
  @Validate(RecipeTimeRangeConstraint)
  time!: number;

  @IsEnum(RecipeTimeUnit)
  timeUnit!: RecipeTimeUnit;

  @IsEnum(RecipeDifficulty)
  difficulty!: RecipeDifficulty;

  @IsInt()
  @Min(1)
  @Max(100)
  servings!: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Matches(/^recipes\/.+/, { each: true })
  imageKeys?: string[];

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
  @MaxLength(500, { each: true })
  steps!: string[];
}
