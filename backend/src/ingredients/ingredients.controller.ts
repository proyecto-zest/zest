import { Controller, Get } from '@nestjs/common';

import { IngredientListItem, IngredientsService } from './ingredients.service';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  findAll(): Promise<IngredientListItem[]> {
    return this.ingredientsService.findAll();
  }
}
