import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuthenticatedUser } from '../auth/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const userId = '11111111-1111-4111-8111-111111111111';

  it('returns id, name and avatarUrl for an existing user', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: userId,
      name: 'Carla Cocinera',
      avatarUrl: 'https://images.test/carla.webp',
    });
    const service = new UsersService({
      user: { findUnique },
    } as unknown as PrismaService);

    await expect(service.findOne(userId)).resolves.toEqual({
      id: userId,
      name: 'Carla Cocinera',
      avatarUrl: 'https://images.test/carla.webp',
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true },
    });
  });

  it('returns a null avatarUrl as-is when the user has none', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: userId,
      name: 'Carla Cocinera',
      avatarUrl: null,
    });
    const service = new UsersService({
      user: { findUnique },
    } as unknown as PrismaService);

    await expect(service.findOne(userId)).resolves.toEqual({
      id: userId,
      name: 'Carla Cocinera',
      avatarUrl: null,
    });
  });

  it('throws NotFoundException when the user does not exist', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const service = new UsersService({
      user: { findUnique },
    } as unknown as PrismaService);

    await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
  });

  describe('findByAuth0Sub', () => {
    it('returns id, name and avatarUrl for an existing sub', async () => {
      const findUnique = jest.fn().mockResolvedValue({
        id: userId,
        name: 'Carla Cocinera',
        avatarUrl: null,
      });
      const service = new UsersService({
        user: { findUnique },
      } as unknown as PrismaService);

      await expect(service.findByAuth0Sub('auth0|zest-user')).resolves.toEqual({
        id: userId,
        name: 'Carla Cocinera',
        avatarUrl: null,
      });
      expect(findUnique).toHaveBeenCalledWith({
        where: { auth0Sub: 'auth0|zest-user' },
        select: { id: true, name: true, avatarUrl: true },
      });
    });

    it('returns null when no user matches the sub', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const service = new UsersService({
        user: { findUnique },
      } as unknown as PrismaService);

      await expect(service.findByAuth0Sub('auth0|missing')).resolves.toBeNull();
    });
  });

  describe('syncFromAuth0Token', () => {
    const authenticatedUser: AuthenticatedUser = {
      sub: 'auth0|zest-user',
      email: 'cook@zest.test',
      name: 'Zest Cook',
      picture: 'https://images.test/cook.webp',
      emailVerified: true,
    };
    const createdUser = {
      id: userId,
      name: 'Zest Cook',
      email: 'cook@zest.test',
      emailVerified: true,
      avatarUrl: 'https://images.test/cook.webp',
    };

    it('creates the User with name and avatarUrl from the token on first call', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const create = jest.fn().mockResolvedValue(createdUser);
      const service = new UsersService({
        user: { findUnique, create },
      } as unknown as PrismaService);

      await expect(
        service.syncFromAuth0Token(authenticatedUser),
      ).resolves.toEqual(createdUser);
      expect(create).toHaveBeenCalledWith({
        data: {
          auth0Sub: 'auth0|zest-user',
          email: 'cook@zest.test',
          name: 'Zest Cook',
          avatarUrl: 'https://images.test/cook.webp',
          emailVerified: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          avatarUrl: true,
        },
      });
    });

    it('only updates email and emailVerified when the User already exists', async () => {
      const findUnique = jest.fn().mockResolvedValue({ id: userId });
      const update = jest.fn().mockResolvedValue({
        ...createdUser,
        name: 'Edited In Zest',
        avatarUrl: 'https://images.test/edited.webp',
      });
      const service = new UsersService({
        user: { findUnique, update },
      } as unknown as PrismaService);

      const result = await service.syncFromAuth0Token(authenticatedUser);

      expect(update).toHaveBeenCalledWith({
        where: { auth0Sub: 'auth0|zest-user' },
        data: { email: 'cook@zest.test', emailVerified: true },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          avatarUrl: true,
        },
      });
      expect(result.name).toBe('Edited In Zest');
      expect(result.avatarUrl).toBe('https://images.test/edited.webp');
    });

    it('throws ConflictException when the email belongs to a different auth0Sub', async () => {
      const findUnique = jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'other-user-id' });
      const create = jest.fn();
      const service = new UsersService({
        user: { findUnique, create },
      } as unknown as PrismaService);

      await expect(
        service.syncFromAuth0Token(authenticatedUser),
      ).rejects.toThrow(ConflictException);
      expect(create).not.toHaveBeenCalled();
    });

    it('throws ConflictException on a concurrent unique-email race caught by Prisma', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      const create = jest.fn().mockRejectedValue(prismaError);
      const service = new UsersService({
        user: { findUnique, create },
      } as unknown as PrismaService);

      await expect(
        service.syncFromAuth0Token(authenticatedUser),
      ).rejects.toThrow(ConflictException);
    });
  });
});
