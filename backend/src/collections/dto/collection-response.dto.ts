import { RecipeTimeUnit } from '@prisma/client';

import { UserResponseDto } from '../../users/dto/user-response.dto';

export class CollectionResponseDto {
  id!: string;
  name!: string;
  coverImageUrl!: string;
  accentColor!: string;
}

export class CollectionListItemResponseDto extends CollectionResponseDto {
  recipeCount!: number;
  containsRecipe?: boolean;
}

export class CollectionRecipeCardResponseDto {
  id!: string;
  title!: string;
  imageUrl!: string | null;
  time!: number;
  timeUnit!: RecipeTimeUnit;
  author!: UserResponseDto | null;
}

export class CollectionDetailResponseDto extends CollectionResponseDto {
  recipes!: CollectionRecipeCardResponseDto[];
}
