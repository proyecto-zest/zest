import { Body, Controller, Post } from '@nestjs/common';

import { CreateRecipeDto } from './dto/create-recipe.dto';
import { CreatedRecipe, RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  create(@Body() createRecipeDto: CreateRecipeDto): Promise<CreatedRecipe> {
    return this.recipesService.create(createRecipeDto);
  }
}
