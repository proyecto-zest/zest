import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RecipeTimeUnit } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

describe('CollectionsService', () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const collectionId = '22222222-2222-4222-8222-222222222222';
  const recipeId = '33333333-3333-4333-8333-333333333333';
  const createCollectionDto: CreateCollectionDto = {
    name: 'Weeknight Dinners',
    coverImageUrl: 'https://images.test/cover.webp',
    accentColor: '#e8415a',
  };
  const getSignedReadUrl = jest.fn((key: string) =>
    Promise.resolve(`https://signed.test/${key}`),
  );
  const storageService = {
    getSignedReadUrl,
  } as unknown as StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    getSignedReadUrl.mockImplementation((key: string) =>
      Promise.resolve(`https://signed.test/${key}`),
    );
  });

  describe('create', () => {
    it('creates a collection owned by the current user', async () => {
      const created = {
        id: collectionId,
        name: createCollectionDto.name,
        coverImageUrl: createCollectionDto.coverImageUrl,
        accentColor: createCollectionDto.accentColor,
      };
      const create = jest.fn().mockResolvedValue(created);
      const service = new CollectionsService(
        { collection: { create } } as unknown as PrismaService,
        storageService,
      );

      await expect(
        service.create(ownerId, createCollectionDto),
      ).resolves.toEqual(created);
      expect(create).toHaveBeenCalledWith({
        data: {
          ownerId,
          name: createCollectionDto.name,
          coverImageUrl: createCollectionDto.coverImageUrl,
          accentColor: createCollectionDto.accentColor,
        },
        select: {
          id: true,
          name: true,
          coverImageUrl: true,
          accentColor: true,
        },
      });
    });
  });

  describe('remove', () => {
    it('deletes the collection when the current user owns it', async () => {
      const findUnique = jest.fn().mockResolvedValue({ ownerId });
      const deleteFn = jest.fn().mockResolvedValue(undefined);
      const service = new CollectionsService(
        {
          collection: { findUnique, delete: deleteFn },
        } as unknown as PrismaService,
        storageService,
      );

      await service.remove(ownerId, collectionId);

      expect(deleteFn).toHaveBeenCalledWith({ where: { id: collectionId } });
    });

    it('throws NotFoundException when the collection does not exist', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const deleteFn = jest.fn();
      const service = new CollectionsService(
        {
          collection: { findUnique, delete: deleteFn },
        } as unknown as PrismaService,
        storageService,
      );

      await expect(service.remove(ownerId, collectionId)).rejects.toThrow(
        NotFoundException,
      );
      expect(deleteFn).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when a different user owns the collection', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValue({ ownerId: 'someone-else-id' });
      const deleteFn = jest.fn();
      const service = new CollectionsService(
        {
          collection: { findUnique, delete: deleteFn },
        } as unknown as PrismaService,
        storageService,
      );

      await expect(service.remove(ownerId, collectionId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(deleteFn).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const collectionRecord = (recipes?: Array<{ recipeId: string }>) => ({
      id: collectionId,
      name: createCollectionDto.name,
      coverImageUrl: createCollectionDto.coverImageUrl,
      accentColor: createCollectionDto.accentColor,
      _count: { recipes: 3 },
      ...(recipes !== undefined ? { recipes } : {}),
    });

    it('returns the owner collections with a recipe count', async () => {
      const findMany = jest.fn().mockResolvedValue([collectionRecord()]);
      const service = new CollectionsService(
        { collection: { findMany } } as unknown as PrismaService,
        storageService,
      );

      await expect(service.findAll(ownerId)).resolves.toEqual([
        {
          id: collectionId,
          name: createCollectionDto.name,
          coverImageUrl: createCollectionDto.coverImageUrl,
          accentColor: createCollectionDto.accentColor,
          recipeCount: 3,
        },
      ]);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId } }),
      );
    });

    it('flags containsRecipe true when recipeId is already saved', async () => {
      const findMany = jest
        .fn()
        .mockResolvedValue([collectionRecord([{ recipeId }])]);
      const service = new CollectionsService(
        { collection: { findMany } } as unknown as PrismaService,
        storageService,
      );

      const [collection] = await service.findAll(ownerId, recipeId);

      expect(collection.containsRecipe).toBe(true);
    });

    it('flags containsRecipe false when recipeId is not saved', async () => {
      const findMany = jest.fn().mockResolvedValue([collectionRecord([])]);
      const service = new CollectionsService(
        { collection: { findMany } } as unknown as PrismaService,
        storageService,
      );

      const [collection] = await service.findAll(ownerId, recipeId);

      expect(collection.containsRecipe).toBe(false);
    });

    it('omits containsRecipe when recipeId is not provided', async () => {
      const findMany = jest.fn().mockResolvedValue([collectionRecord()]);
      const service = new CollectionsService(
        { collection: { findMany } } as unknown as PrismaService,
        storageService,
      );

      const [collection] = await service.findAll(ownerId);

      expect(collection).not.toHaveProperty('containsRecipe');
    });
  });

  describe('findOne', () => {
    const recipeRecord = {
      id: recipeId,
      title: 'Ensalada de tomate',
      time: 10,
      timeUnit: RecipeTimeUnit.MINUTOS,
      images: [{ s3Key: 'recipes/image.webp' }],
      author: { id: ownerId, name: 'Zest Cook', avatarUrl: null },
    };

    it('returns the collection with its recipe cards', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: collectionId,
        ownerId,
        name: createCollectionDto.name,
        coverImageUrl: createCollectionDto.coverImageUrl,
        accentColor: createCollectionDto.accentColor,
        recipes: [{ recipe: recipeRecord }],
      });
      const service = new CollectionsService(
        { collection: { findUnique } } as unknown as PrismaService,
        storageService,
      );

      await expect(service.findOne(ownerId, collectionId)).resolves.toEqual({
        id: collectionId,
        name: createCollectionDto.name,
        coverImageUrl: createCollectionDto.coverImageUrl,
        accentColor: createCollectionDto.accentColor,
        recipes: [
          {
            id: recipeId,
            title: 'Ensalada de tomate',
            imageUrl: 'https://signed.test/recipes/image.webp',
            time: 10,
            timeUnit: RecipeTimeUnit.MINUTOS,
            author: { id: ownerId, name: 'Zest Cook', avatarUrl: null },
          },
        ],
      });
    });

    it('returns imageUrl as null when a recipe has no images', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: collectionId,
        ownerId,
        name: createCollectionDto.name,
        coverImageUrl: createCollectionDto.coverImageUrl,
        accentColor: createCollectionDto.accentColor,
        recipes: [{ recipe: { ...recipeRecord, images: [] } }],
      });
      const service = new CollectionsService(
        { collection: { findUnique } } as unknown as PrismaService,
        storageService,
      );

      const { recipes } = await service.findOne(ownerId, collectionId);

      expect(recipes[0].imageUrl).toBeNull();
      expect(getSignedReadUrl).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the collection does not exist', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const service = new CollectionsService(
        { collection: { findUnique } } as unknown as PrismaService,
        storageService,
      );

      await expect(service.findOne(ownerId, collectionId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when a different user owns the collection', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: collectionId,
        ownerId: 'someone-else-id',
        name: createCollectionDto.name,
        coverImageUrl: createCollectionDto.coverImageUrl,
        accentColor: createCollectionDto.accentColor,
        recipes: [],
      });
      const service = new CollectionsService(
        { collection: { findUnique } } as unknown as PrismaService,
        storageService,
      );

      await expect(service.findOne(ownerId, collectionId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
