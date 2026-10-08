import {
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RecipeTimeUnit } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

describe('CollectionsService', () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const collectionId = '22222222-2222-4222-8222-222222222222';
  const recipeId = '33333333-3333-4333-8333-333333333333';
  const coverKey = 'collections/44444444-4444-4444-8444-444444444444.webp';
  const signedUrl = (key: string): string => `https://signed.test/${key}`;
  const createCollectionDto: CreateCollectionDto = {
    name: 'Weeknight Dinners',
    coverImageKey: coverKey,
    accentColor: '#e8415a',
  };
  const getSignedReadUrl = jest.fn<Promise<string>, [string]>();
  const getSignedUploadUrl = jest.fn<Promise<string>, [string, string]>();
  const objectExists = jest.fn<Promise<boolean>, [string]>();
  const deleteObject = jest.fn<Promise<void>, [string]>();
  const storageService = {
    getSignedReadUrl,
    getSignedUploadUrl,
    objectExists,
    deleteObject,
  } as unknown as StorageService;

  const buildService = (collection: Record<string, jest.Mock>) =>
    new CollectionsService(
      { collection } as unknown as PrismaService,
      storageService,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    getSignedReadUrl.mockImplementation((key) =>
      Promise.resolve(signedUrl(key)),
    );
    getSignedUploadUrl.mockResolvedValue('https://upload.test');
    objectExists.mockResolvedValue(true);
    deleteObject.mockResolvedValue(undefined);
  });

  describe('createCoverUploadUrl', () => {
    it('generates a collections/ key and a signed upload URL', async () => {
      const result = await buildService({}).createCoverUploadUrl({
        contentType: 'image/png',
      });

      expect(result.uploadUrl).toBe('https://upload.test');
      expect(result.coverImageKey).toMatch(/^collections\/[0-9a-f-]{36}\.png$/);
      expect(getSignedUploadUrl).toHaveBeenCalledWith(
        result.coverImageKey,
        'image/png',
      );
    });
  });

  describe('create', () => {
    it('creates a collection with a cover after checking it exists in S3', async () => {
      const create = jest.fn().mockResolvedValue({
        id: collectionId,
        name: createCollectionDto.name,
        coverImageKey: coverKey,
        accentColor: createCollectionDto.accentColor,
      });

      await expect(
        buildService({ create }).create(ownerId, createCollectionDto),
      ).resolves.toEqual({
        id: collectionId,
        name: createCollectionDto.name,
        coverImageUrl: signedUrl(coverKey),
        accentColor: createCollectionDto.accentColor,
      });
      expect(objectExists).toHaveBeenCalledWith(coverKey);
      expect(create).toHaveBeenCalledWith({
        data: {
          ownerId,
          name: createCollectionDto.name,
          coverImageKey: coverKey,
          accentColor: createCollectionDto.accentColor,
        },
        select: {
          id: true,
          name: true,
          coverImageKey: true,
          accentColor: true,
        },
      });
    });

    it('creates a collection without a cover and returns a null coverImageUrl', async () => {
      const create = jest.fn().mockResolvedValue({
        id: collectionId,
        name: createCollectionDto.name,
        coverImageKey: null,
        accentColor: createCollectionDto.accentColor,
      });

      const result = await buildService({ create }).create(ownerId, {
        name: createCollectionDto.name,
        accentColor: createCollectionDto.accentColor,
      });

      expect(result.coverImageUrl).toBeNull();
      expect(objectExists).not.toHaveBeenCalled();
      expect(getSignedReadUrl).not.toHaveBeenCalled();
      expect(create).toHaveBeenCalledWith({
        data: {
          ownerId,
          name: createCollectionDto.name,
          coverImageKey: null,
          accentColor: createCollectionDto.accentColor,
        },
        select: {
          id: true,
          name: true,
          coverImageKey: true,
          accentColor: true,
        },
      });
    });

    it('rejects a cover that does not exist in S3', async () => {
      const create = jest.fn();
      objectExists.mockResolvedValue(false);

      await expect(
        buildService({ create }).create(ownerId, createCollectionDto),
      ).rejects.toThrow(
        new BadRequestException(
          `Las siguientes imágenes no existen en S3: ${coverKey}`,
        ),
      );
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the collection when the current user owns it', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValue({ ownerId, coverImageKey: null });
      const deleteFn = jest.fn().mockResolvedValue(undefined);

      await buildService({ findUnique, delete: deleteFn }).remove(
        ownerId,
        collectionId,
      );

      expect(deleteFn).toHaveBeenCalledWith({ where: { id: collectionId } });
      expect(deleteObject).not.toHaveBeenCalled();
    });

    it('deletes the cover from S3 when the collection had one', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValue({ ownerId, coverImageKey: coverKey });
      const deleteFn = jest.fn().mockResolvedValue(undefined);
      const count = jest.fn().mockResolvedValue(0);

      await buildService({ findUnique, delete: deleteFn, count }).remove(
        ownerId,
        collectionId,
      );

      expect(count).toHaveBeenCalledWith({
        where: { coverImageKey: coverKey },
      });
      expect(deleteObject).toHaveBeenCalledWith(coverKey);
    });

    it('keeps the S3 object when another collection still uses it', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValue({ ownerId, coverImageKey: coverKey });
      const deleteFn = jest.fn().mockResolvedValue(undefined);
      const count = jest.fn().mockResolvedValue(1);

      await buildService({ findUnique, delete: deleteFn, count }).remove(
        ownerId,
        collectionId,
      );

      expect(deleteObject).not.toHaveBeenCalled();
    });

    it('logs an S3 failure without failing the deletion', async () => {
      const error = new Error('S3 unavailable');
      const loggerError = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const findUnique = jest
        .fn()
        .mockResolvedValue({ ownerId, coverImageKey: coverKey });
      const deleteFn = jest.fn().mockResolvedValue(undefined);
      const count = jest.fn().mockResolvedValue(0);
      deleteObject.mockRejectedValue(error);

      await expect(
        buildService({ findUnique, delete: deleteFn, count }).remove(
          ownerId,
          collectionId,
        ),
      ).resolves.toBeUndefined();
      expect(loggerError).toHaveBeenCalledWith(
        `No se pudo borrar de S3 la portada ${coverKey}`,
        error.stack,
      );
    });

    it('throws NotFoundException when the collection does not exist', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const deleteFn = jest.fn();

      await expect(
        buildService({ findUnique, delete: deleteFn }).remove(
          ownerId,
          collectionId,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(deleteFn).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when a different user owns the collection', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValue({ ownerId: 'someone-else-id', coverImageKey: null });
      const deleteFn = jest.fn();

      await expect(
        buildService({ findUnique, delete: deleteFn }).remove(
          ownerId,
          collectionId,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(deleteFn).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const collectionRecord = (
      recipes?: Array<{ recipeId: string }>,
      coverImageKey: string | null = coverKey,
    ) => ({
      id: collectionId,
      name: createCollectionDto.name,
      coverImageKey,
      accentColor: createCollectionDto.accentColor,
      _count: { recipes: 3 },
      ...(recipes !== undefined ? { recipes } : {}),
    });

    it('returns the owner collections with a signed cover and a recipe count', async () => {
      const findMany = jest.fn().mockResolvedValue([collectionRecord()]);

      await expect(
        buildService({ findMany }).findAll(ownerId),
      ).resolves.toEqual([
        {
          id: collectionId,
          name: createCollectionDto.name,
          coverImageUrl: signedUrl(coverKey),
          accentColor: createCollectionDto.accentColor,
          recipeCount: 3,
        },
      ]);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId } }),
      );
    });

    it('returns a null coverImageUrl for a collection without a cover', async () => {
      const findMany = jest
        .fn()
        .mockResolvedValue([collectionRecord(undefined, null)]);

      const [collection] = await buildService({ findMany }).findAll(ownerId);

      expect(collection.coverImageUrl).toBeNull();
      expect(getSignedReadUrl).not.toHaveBeenCalled();
    });

    it('flags containsRecipe true when recipeId is already saved', async () => {
      const findMany = jest
        .fn()
        .mockResolvedValue([collectionRecord([{ recipeId }])]);

      const [collection] = await buildService({ findMany }).findAll(
        ownerId,
        recipeId,
      );

      expect(collection.containsRecipe).toBe(true);
    });

    it('flags containsRecipe false when recipeId is not saved', async () => {
      const findMany = jest.fn().mockResolvedValue([collectionRecord([])]);

      const [collection] = await buildService({ findMany }).findAll(
        ownerId,
        recipeId,
      );

      expect(collection.containsRecipe).toBe(false);
    });

    it('omits containsRecipe when recipeId is not provided', async () => {
      const findMany = jest.fn().mockResolvedValue([collectionRecord()]);

      const [collection] = await buildService({ findMany }).findAll(ownerId);

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
    const collectionRecord = (overrides: Record<string, unknown> = {}) => ({
      id: collectionId,
      ownerId,
      name: createCollectionDto.name,
      coverImageKey: coverKey,
      accentColor: createCollectionDto.accentColor,
      recipes: [{ recipe: recipeRecord }],
      ...overrides,
    });

    it('returns the collection with a signed cover and its recipe cards', async () => {
      const findUnique = jest.fn().mockResolvedValue(collectionRecord());

      await expect(
        buildService({ findUnique }).findOne(ownerId, collectionId),
      ).resolves.toEqual({
        id: collectionId,
        name: createCollectionDto.name,
        coverImageUrl: signedUrl(coverKey),
        accentColor: createCollectionDto.accentColor,
        recipes: [
          {
            id: recipeId,
            title: 'Ensalada de tomate',
            imageUrl: signedUrl('recipes/image.webp'),
            time: 10,
            timeUnit: RecipeTimeUnit.MINUTOS,
            author: { id: ownerId, name: 'Zest Cook', avatarUrl: null },
          },
        ],
      });
    });

    it('returns a null coverImageUrl when the collection has no cover', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValue(collectionRecord({ coverImageKey: null }));

      const result = await buildService({ findUnique }).findOne(
        ownerId,
        collectionId,
      );

      expect(result.coverImageUrl).toBeNull();
    });

    it('returns imageUrl as null when a recipe has no images', async () => {
      const findUnique = jest.fn().mockResolvedValue(
        collectionRecord({
          coverImageKey: null,
          recipes: [{ recipe: { ...recipeRecord, images: [] } }],
        }),
      );

      const { recipes } = await buildService({ findUnique }).findOne(
        ownerId,
        collectionId,
      );

      expect(recipes[0].imageUrl).toBeNull();
      expect(getSignedReadUrl).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the collection does not exist', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        buildService({ findUnique }).findOne(ownerId, collectionId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when a different user owns the collection', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValue(collectionRecord({ ownerId: 'someone-else-id' }));

      await expect(
        buildService({ findUnique }).findOne(ownerId, collectionId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
