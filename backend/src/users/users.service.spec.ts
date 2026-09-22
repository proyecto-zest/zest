import { NotFoundException } from '@nestjs/common';

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
});
