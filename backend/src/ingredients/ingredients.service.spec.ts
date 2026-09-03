import { PrismaService } from '../prisma/prisma.service';
import { IngredientsService } from './ingredients.service';

describe('IngredientsService', () => {
  it('returns only id and name for the complete catalog', async () => {
    const ingredients = [
      { id: '11111111-1111-4111-8111-111111111111', name: 'Tomate' },
      { id: '22222222-2222-4222-8222-222222222222', name: 'Zanahoria' },
    ];
    const findMany = jest.fn().mockResolvedValue(ingredients);
    const service = new IngredientsService({
      ingredient: { findMany },
    } as unknown as PrismaService);

    await expect(service.findAll()).resolves.toBe(ingredients);
    expect(findMany).toHaveBeenCalledWith({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  });
});
