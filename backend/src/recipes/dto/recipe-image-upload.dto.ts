import { IsIn } from 'class-validator';

export const RECIPE_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type RecipeImageContentType =
  (typeof RECIPE_IMAGE_CONTENT_TYPES)[number];

export class RecipeImageUploadRequestDto {
  @IsIn(RECIPE_IMAGE_CONTENT_TYPES)
  contentType!: RecipeImageContentType;
}

export class RecipeImageUploadResponseDto {
  uploadUrl!: string;
  imageKey!: string;
}
