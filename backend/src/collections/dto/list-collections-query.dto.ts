import { IsOptional, IsUUID } from 'class-validator';

export class ListCollectionsQueryDto {
  @IsOptional()
  @IsUUID()
  recipeId?: string;
}
