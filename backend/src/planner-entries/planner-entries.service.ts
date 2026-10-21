import {
  BadRequestException,
  Injectable,
  NotFoundException,
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
    // Sign outside the transaction, before writing: a signing failure leaves
    // no increment behind for the client to accidentally retry.
    const imageUrl = imageKey
      ? await this.storageService.getSignedReadUrl(imageKey)
      : null;

    const entry = await this.prisma
      .$transaction(async (transaction) => {
        // The unique key prevents duplicates; the database ON CONFLICT upsert
        // makes the increment atomic. Do not replace it with read-then-update.
        // The database CHECK enforces 1..100; retain the guard as a fallback.
        const entry = await transaction.plannerEntry.upsert({
          where: {
            userId_recipeId_date: { userId, recipeId: recipe.id, date },
          },
          create: { userId, recipeId: recipe.id, date, quantity: dto.quantity },
          update: { quantity: { increment: dto.quantity } },
        });
        if (entry.quantity > MAX_PLANNER_QUANTITY) {
          throw new BadRequestException(
            `Total quantity for this recipe and date must not exceed ${MAX_PLANNER_QUANTITY}`,
          );
        }
        return entry;
      })
      .catch((error: unknown) => {
        // Prisma 6 reports native ON CONFLICT CHECK/FK errors as UnknownRequestError.
        // Match both the PostgreSQL code and our exact constraint, never all DB errors.
        if (error instanceof Prisma.PrismaClientUnknownRequestError) {
          if (
            error.message.includes('23514') &&
            error.message.includes('planner_entries_quantity_check')
          ) {
            throw new BadRequestException(
              `Total quantity for this recipe and date must not exceed ${MAX_PLANNER_QUANTITY}`,
            );
          }
          if (
            error.message.includes('23503') &&
            error.message.includes('planner_entries_recipe_id_fkey')
          ) {
            throw new NotFoundException('Recipe not found');
          }
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (
            error.code === 'P2004' &&
            error.message.includes('planner_entries_quantity_check')
          ) {
            throw new BadRequestException(
              `Total quantity for this recipe and date must not exceed ${MAX_PLANNER_QUANTITY}`,
            );
          }
          // The recipe can be deleted between the lookup and the upsert.
          if (
            error.code === 'P2003' &&
            String(error.meta?.constraint ?? error.meta?.field_name).includes(
              'planner_entries_recipe_id_fkey',
            )
          ) {
            throw new NotFoundException('Recipe not found');
          }
        }
        throw error;
      });

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
}
