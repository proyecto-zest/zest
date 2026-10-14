import { PrismaClient } from '@prisma/client';

import { resetTestDatabase } from './test-database';

const describeWithDatabase =
  process.env.RUN_DATABASE_TESTS === 'true' ? describe : describe.skip;

describeWithDatabase('User model (database)', () => {
  const prisma = new PrismaClient();

  beforeAll(() => prisma.$connect());
  beforeEach(() => resetTestDatabase(prisma));
  afterAll(() => prisma.$disconnect());

  it('creates and reads an Auth0-linked user', async () => {
    const createdUser = await prisma.user.create({
      data: {
        auth0Sub: 'auth0|user-model-test',
        name: 'Taylor Reed',
        email: 'taylor.reed@example.com',
        emailVerified: true,
        avatarUrl: 'https://example.com/avatar.webp',
      },
    });

    const user = await prisma.user.findUnique({
      where: { auth0Sub: createdUser.auth0Sub },
    });

    expect(user).toMatchObject({
      id: createdUser.id,
      auth0Sub: 'auth0|user-model-test',
      name: 'Taylor Reed',
      email: 'taylor.reed@example.com',
      emailVerified: true,
      avatarUrl: 'https://example.com/avatar.webp',
    });
    expect(user?.createdAt).toBeInstanceOf(Date);
    expect(user?.updatedAt).toBeInstanceOf(Date);
  });

  it('rejects duplicate Auth0 subjects', async () => {
    await prisma.user.create({
      data: {
        auth0Sub: 'auth0|duplicate-subject',
        name: 'First User',
        email: 'first@example.com',
      },
    });

    await expect(
      prisma.user.create({
        data: {
          auth0Sub: 'auth0|duplicate-subject',
          name: 'Second User',
          email: 'second@example.com',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejects duplicate email addresses', async () => {
    await prisma.user.create({
      data: {
        auth0Sub: 'auth0|first-email-owner',
        name: 'First User',
        email: 'shared@example.com',
      },
    });

    await expect(
      prisma.user.create({
        data: {
          auth0Sub: 'auth0|second-email-owner',
          name: 'Second User',
          email: 'shared@example.com',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});
