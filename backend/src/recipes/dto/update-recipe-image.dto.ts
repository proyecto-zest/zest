import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateRecipeImageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^recipes\/.+/)
  imageKey?: string;
}
