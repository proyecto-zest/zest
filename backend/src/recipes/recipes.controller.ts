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
  CreatedRecipeResponseDto,
  PaginatedRecipesResponseDto,
  RecipeDetailResponseDto,
  RecipeMetadataResponseDto,
} from './dto/recipe-response.dto';
import { UpdateRecipeImageDto } from './dto/update-recipe-image.dto';
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

  @Post()
  create(
    @Body() createRecipeDto: CreateRecipeDto,
  ): Promise<CreatedRecipeResponseDto> {
    return this.recipesService.create(createRecipeDto);
  }

  @Put(':id')
  updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRecipeImageDto: UpdateRecipeImageDto,
  ): Promise<RecipeDetailResponseDto> {
    return this.recipesService.updateImage(id, updateRecipeImageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.recipesService.remove(id);
  }
}
