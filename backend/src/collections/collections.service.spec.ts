import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

describe('CollectionsService', () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const collectionId = '22222222-2222-4222-8222-222222222222';
  const createCollectionDto: CreateCollectionDto = {
    name: 'Weeknight Dinners',
    coverImageUrl: 'https://images.test/cover.webp',
    accentColor: '#e8415a',
  };

  describe('create', () => {
    it('creates a collection owned by the current user', async () => {
      const created = {
        id: collectionId,
        name: createCollectionDto.name,
        coverImageUrl: createCollectionDto.coverImageUrl,
        accentColor: createCollectionDto.accentColor,
      };
      const create = jest.fn().mockResolvedValue(created);
      const service = new CollectionsService({
        collection: { create },
      } as unknown as PrismaService);

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
      const service = new CollectionsService({
        collection: { findUnique, delete: deleteFn },
      } as unknown as PrismaService);

      await service.remove(ownerId, collectionId);

      expect(deleteFn).toHaveBeenCalledWith({ where: { id: collectionId } });
    });

    it('throws NotFoundException when the collection does not exist', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const deleteFn = jest.fn();
      const service = new CollectionsService({
        collection: { findUnique, delete: deleteFn },
      } as unknown as PrismaService);

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
      const service = new CollectionsService({
        collection: { findUnique, delete: deleteFn },
      } as unknown as PrismaService);

      await expect(service.remove(ownerId, collectionId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(deleteFn).not.toHaveBeenCalled();
    });
  });
});
