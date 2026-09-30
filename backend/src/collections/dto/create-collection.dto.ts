import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  coverImageUrl!: string;

  @IsHexColor()
  accentColor!: string;
}
