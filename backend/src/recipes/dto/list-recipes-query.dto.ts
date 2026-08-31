import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

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
}
