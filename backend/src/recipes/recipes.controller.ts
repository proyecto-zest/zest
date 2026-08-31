import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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
}
