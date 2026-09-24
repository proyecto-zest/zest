import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuthenticatedUser } from '../auth/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserResponseDto } from './dto/current-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  async findByAuth0Sub(auth0Sub: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { auth0Sub },
      select: { id: true, name: true, avatarUrl: true },
    });

    return user;
  }

  /**
   * Creates or syncs the local `User` from a validated Auth0 token. Auth0 is
   * only the seed for `name`/`avatarUrl`: they're set on the very first call
   * (account creation) and then belong to the user — Zest doesn't overwrite
   * them on later logins, so an edit made in-app (e.g. the profile screen)
   * survives the next Auth0 session. `email`/`emailVerified` are the
   * opposite: Auth0 is the permanent source of truth for those, so every
   * call re-syncs them regardless of what's stored locally.
   *
   * Do not "fix" the update below to also set `name`/`avatarUrl` — that
   * would silently discard whatever the user changed in Zest the next time
   * they log in.
   */
  async syncFromAuth0Token(
    authenticatedUser: AuthenticatedUser,
  ): Promise<CurrentUserResponseDto> {
    const {
      sub: auth0Sub,
      email,
      name,
      picture,
      emailVerified,
    } = authenticatedUser;
    const existingBySub = await this.prisma.user.findUnique({
      where: { auth0Sub },
    });

    if (existingBySub) {
      const updated = await this.prisma.user.update({
        where: { auth0Sub },
        data: { email, emailVerified },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          avatarUrl: true,
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        emailVerified: updated.emailVerified,
        avatarUrl: updated.avatarUrl,
      };
    }

    const existingByEmail = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : null;

    if (existingByEmail) {
      throw new ConflictException(
        `An account with email "${email}" already exists under a different login method`,
      );
    }

    try {
      const created = await this.prisma.user.create({
        data: {
          auth0Sub,
          email: email ?? '',
          name: name ?? '',
          avatarUrl: picture,
          emailVerified: emailVerified ?? false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          avatarUrl: true,
        },
      });

      return {
        id: created.id,
        name: created.name,
        email: created.email,
        emailVerified: created.emailVerified,
        avatarUrl: created.avatarUrl,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // The unique violation could be on auth0Sub, not email: two
        // concurrent GET /users/me calls for the same new user (React
        // StrictMode double-invoking a useEffect in dev, for example) both
        // pass the findUnique check above, then race on create — the loser
        // lands here even though there's no real conflict, just a duplicate
        // signup for the *same* identity. Re-check by auth0Sub before
        // concluding it's a genuine cross-account email collision.
        const raceWinner = await this.prisma.user.findUnique({
          where: { auth0Sub },
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            avatarUrl: true,
          },
        });

        if (raceWinner) {
          return raceWinner;
        }

        throw new ConflictException(
          `An account with email "${email}" already exists under a different login method`,
        );
      }

      throw error;
    }
  }
}
