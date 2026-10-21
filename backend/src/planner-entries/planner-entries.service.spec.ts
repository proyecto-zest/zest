import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, RecipeTimeUnit } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PlannerEntriesService } from './planner-entries.service';

describe('PlannerEntriesService', () => {
  const recipe = {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Soup',
    time: 20,
    timeUnit: RecipeTimeUnit.MINUTOS,
    images: [{ s3Key: 'recipes/soup.webp' }],
  };
  const dto = { recipeId: recipe.id, date: '2026-11-03', quantity: 1 };
  const upsert = jest.fn();
  const sign = jest.fn();
  const transaction = jest.fn((operation: (tx: unknown) => Promise<unknown>) =>
    operation({ plannerEntry: { upsert } }),
  );
  let service: PlannerEntriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    sign.mockResolvedValue('https://signed.test/soup');
    upsert.mockResolvedValue({
      id: 'entry',
      date: new Date('2026-11-03'),
      quantity: 1,
    });
    service = new PlannerEntriesService(
      {
        recipe: { findUnique: jest.fn().mockResolvedValue(recipe) },
        $transaction: transaction,
      } as unknown as PrismaService,
      {
        getSignedReadUrl: sign,
      } as unknown as StorageService,
    );
  });

  it('finishes signing before opening the write transaction', async () => {
    sign.mockImplementationOnce(() => {
      expect(transaction).not.toHaveBeenCalled();
      return Promise.resolve('https://signed.test/soup');
    });
    await service.create('user', dto);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('does not write if signing fails', async () => {
    const error = new Error('Credentials unavailable');
    sign.mockRejectedValueOnce(error);
    await expect(service.create('user', dto)).rejects.toBe(error);
    expect(transaction).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('retains the application overflow guard as a fallback', async () => {
    upsert.mockResolvedValueOnce({ quantity: 101 });
    await expect(service.create('user', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('maps only the quantity constraint to 400', async () => {
    upsert.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError(
        'Check constraint planner_entries_quantity_check violated',
        { code: 'P2004', clientVersion: '6.19.3' },
      ),
    );
    await expect(service.create('user', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('maps a recipe deleted before the upsert to 404', async () => {
    upsert.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Foreign key violated', {
        code: 'P2003',
        clientVersion: '6.19.3',
        meta: { field_name: 'planner_entries_recipe_id_fkey (index)' },
      }),
    );
    await expect(service.create('user', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps the native upsert CHECK error to 400', async () => {
    upsert.mockRejectedValueOnce(
      new Prisma.PrismaClientUnknownRequestError(
        '23514 violates check constraint planner_entries_quantity_check',
        { clientVersion: '6.19.3' },
      ),
    );
    await expect(service.create('user', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it.each([
    new Error('Database unavailable'),
    new Prisma.PrismaClientUnknownRequestError(
      '23514 violates another constraint',
      { clientVersion: '6.19.3' },
    ),
    new Prisma.PrismaClientKnownRequestError('Another constraint', {
      code: 'P2004',
      clientVersion: '6.19.3',
    }),
    new Prisma.PrismaClientKnownRequestError('Another FK', {
      code: 'P2003',
      clientVersion: '6.19.3',
      meta: { field_name: 'planner_entries_user_id_fkey' },
    }),
  ])('preserves unrelated errors: %s', async (error) => {
    upsert.mockRejectedValueOnce(error);
    await expect(service.create('user', dto)).rejects.toBe(error);
  });
});
