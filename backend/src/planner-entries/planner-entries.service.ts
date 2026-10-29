import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RECIPE_IMAGE_ORDER } from '../recipes/recipe-image-order';
import { StorageService } from '../storage/storage.service';
import { CreatePlannerEntryDto } from './dto/create-planner-entry.dto';
import { PlannerEntryResponseDto } from './dto/planner-entry-response.dto';
import { MAX_PLANNER_QUANTITY } from './planner-entries.constants';

@Injectable()
export class PlannerEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    userId: string,
    dto: CreatePlannerEntryDto,
  ): Promise<PlannerEntryResponseDto> {
    // UTC midnight is only the Prisma representation of a PostgreSQL DATE;
    // the API accepts and returns a calendar date without timezone conversion.
    const date = new Date(`${dto.date}T00:00:00.000Z`);

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipeId },
      select: {
        id: true,
        title: true,
        time: true,
        timeUnit: true,
        images: {
          select: { s3Key: true },
          orderBy: RECIPE_IMAGE_ORDER,
          take: 1,
        },
      },
    });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const imageKey = recipe.images[0]?.s3Key;
    // Sign before writing: a signing failure leaves
    // no increment behind for the client to accidentally retry.
    const imageUrl = imageKey
      ? await this.storageService.getSignedReadUrl(imageKey)
      : null;

    // ON CONFLICT makes the increment atomic; the database CHECK enforces
    // 1..100. No additional transaction or read-then-update is needed.
    const entry = await this.prisma.plannerEntry
      .upsert({
        where: {
          userId_recipeId_date: { userId, recipeId: recipe.id, date },
        },
        create: { userId, recipeId: recipe.id, date, quantity: dto.quantity },
        update: { quantity: { increment: dto.quantity } },
      })
      .catch((error: unknown) => this.rethrowPersistenceError(error));

    return {
      id: entry.id,
      date: entry.date.toISOString().slice(0, 10),
      quantity: entry.quantity,
      recipeId: recipe.id,
      title: recipe.title,
      imageUrl,
      time: recipe.time,
      timeUnit: recipe.timeUnit,
    };
  }

  private rethrowPersistenceError(error: unknown): never {
    let code: string;
    let details: string;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      code = error.code;
      const metadataDetails =
        error.meta?.constraint ??
        error.meta?.field_name ??
        error.meta?.database_error;
      details =
        typeof metadataDetails === 'string' ? metadataDetails : error.message;
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      // Prisma 6 can expose native upsert errors without structured metadata.
      // Keep this compatibility fallback here and match a code AND our constraint.
      code = error.message.match(/\b(23514|23503)\b/)?.[1] ?? '';
      details = error.message;
    } else {
      throw error;
    }

    const constraint = details.match(
      /\bplanner_entries_(quantity_check|recipe_id_fkey|user_id_fkey)\b/,
    )?.[0];
    if (
      (code === 'P2004' || code === '23514') &&
      constraint === 'planner_entries_quantity_check'
    ) {
      throw new BadRequestException(
        `Total quantity for this recipe and date must not exceed ${MAX_PLANNER_QUANTITY}`,
      );
    }
    if (code === 'P2003' || code === '23503') {
      if (constraint === 'planner_entries_recipe_id_fkey') {
        throw new NotFoundException('Recipe not found');
      }
      if (constraint === 'planner_entries_user_id_fkey') {
        throw new UnauthorizedException(
          'No local account for this token — call GET /users/me first',
        );
      }
    }
    throw error;
  }
}
