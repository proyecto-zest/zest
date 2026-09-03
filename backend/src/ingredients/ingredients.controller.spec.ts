import { IngredientsController } from './ingredients.controller';
import { IngredientListItem, IngredientsService } from './ingredients.service';

describe('IngredientsController', () => {
  it('delegates the catalog query to the service', async () => {
    const ingredients: IngredientListItem[] = [
      { id: '11111111-1111-4111-8111-111111111111', name: 'Tomate' },
    ];
    const findAll = jest.fn().mockResolvedValue(ingredients);
    const controller = new IngredientsController({
      findAll,
    } as unknown as IngredientsService);

    await expect(controller.findAll()).resolves.toBe(ingredients);
    expect(findAll).toHaveBeenCalledTimes(1);
  });
});
