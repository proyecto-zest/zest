import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
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

  create(
    userId: string,
    dto: CreatePlannerEntryDto,
  ): Promise<PlannerEntryResponseDto> {
    // UTC midnight is only the Prisma representation of a PostgreSQL DATE;
    // the API accepts and returns a calendar date without timezone conversion.
    const date = new Date(`${dto.date}T00:00:00.000Z`);

    return this.prisma.$transaction(async (transaction) => {
      const recipe = await transaction.recipe.findUnique({
        where: { id: dto.recipeId },
        select: {
          id: true,
          title: true,
          time: true,
          timeUnit: true,
          images: { select: { s3Key: true }, take: 1 },
        },
      });
      if (!recipe) {
        throw new NotFoundException('Recipe not found');
      }

      const imageKey = recipe.images[0]?.s3Key;
      const imageUrl = imageKey
        ? await this.storageService.getSignedReadUrl(imageKey)
        : null;

      // The compound unique key from ZEST-118 prevents duplicate rows.
      // Increment and limit check share a transaction, so an overflow rolls
      // back and concurrent requests cannot leave a total greater than 100.
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
    });
  }
}
