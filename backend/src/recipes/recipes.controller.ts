import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreateRecipeDto } from './dto/create-recipe.dto';
import {
  CreatedRecipe,
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

  @Post()
  create(@Body() createRecipeDto: CreateRecipeDto): Promise<CreatedRecipe> {
    return this.recipesService.create(createRecipeDto);
  }
}
