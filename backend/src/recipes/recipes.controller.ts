import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import {
  RecipeImageUploadRequestDto,
  RecipeImageUploadResponseDto,
} from './dto/recipe-image-upload.dto';
import {
  CreatedRecipeResponseDto,
  PaginatedRecipesResponseDto,
  RecipeDetailResponseDto,
  RecipeMetadataResponseDto,
} from './dto/recipe-response.dto';
import { UpdateRecipeImagesDto } from './dto/update-recipe-images.dto';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get('metadata')
  getMetadata(): RecipeMetadataResponseDto {
    return this.recipesService.getMetadata();
  }

  @Get()
  findAll(
    @Query() query: ListRecipesQueryDto,
  ): Promise<PaginatedRecipesResponseDto> {
    return this.recipesService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RecipeDetailResponseDto> {
    return this.recipesService.findOne(id);
  }

  @Post('image-upload-url')
  createImageUploadUrl(
    @Body() requestDto: RecipeImageUploadRequestDto,
  ): Promise<RecipeImageUploadResponseDto> {
    return this.recipesService.createImageUploadUrl(requestDto);
  }

  @Post()
  create(
    @Body() createRecipeDto: CreateRecipeDto,
  ): Promise<CreatedRecipeResponseDto> {
    return this.recipesService.create(createRecipeDto);
  }

  @Put(':id')
  updateImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRecipeImagesDto: UpdateRecipeImagesDto,
  ): Promise<RecipeDetailResponseDto> {
    return this.recipesService.updateImages(id, updateRecipeImagesDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.recipesService.remove(id);
  }
}
