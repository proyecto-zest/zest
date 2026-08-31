import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import {
  CreatedRecipe,
  PaginatedRecipes,
  RecipeMetadata,
  RecipesService,
} from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get('metadata')
  getMetadata(): RecipeMetadata {
    return this.recipesService.getMetadata();
  }

  @Get()
  findAll(@Query() query: ListRecipesQueryDto): Promise<PaginatedRecipes> {
    return this.recipesService.findAll(query);
  }

  @Post()
  create(@Body() createRecipeDto: CreateRecipeDto): Promise<CreatedRecipe> {
    return this.recipesService.create(createRecipeDto);
  }
}
