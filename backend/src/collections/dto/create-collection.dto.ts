import {
  IsHexColor,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export const COLLECTION_COVER_KEY_PATTERN =
  /^collections\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(COLLECTION_COVER_KEY_PATTERN)
  coverImageKey?: string;

  @IsHexColor()
  accentColor!: string;
}
