import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CollectionDetailResponseDto,
  CollectionListItemResponseDto,
  CollectionRecipeCardResponseDto,
  CollectionResponseDto,
} from './dto/collection-response.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';

const collectionRecipeCardSelect = {
  id: true,
  title: true,
  time: true,
  timeUnit: true,
  images: { select: { s3Key: true }, take: 1 },
  author: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.RecipeSelect;

type CollectionRecipeCardRecord = Prisma.RecipeGetPayload<{
  select: typeof collectionRecipeCardSelect;
}>;

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(
    ownerId: string,
    recipeId?: string,
  ): Promise<CollectionListItemResponseDto[]> {
    const collections = await this.prisma.collection.findMany({
      where: { ownerId },
      select: {
        id: true,
        name: true,
        coverImageUrl: true,
        accentColor: true,
        _count: { select: { recipes: true } },
        ...(recipeId !== undefined
          ? { recipes: { where: { recipeId }, select: { recipeId: true } } }
          : {}),
      },
      orderBy: { id: 'asc' },
    });

    return collections.map(({ _count, recipes, ...collection }) => ({
      ...collection,
      recipeCount: _count.recipes,
      ...(recipeId !== undefined
        ? {
            containsRecipe:
              (recipes as Array<{ recipeId: string }> | undefined)?.length ===
              1,
          }
        : {}),
    }));
  }

  async findOne(
    ownerId: string,
    id: string,
  ): Promise<CollectionDetailResponseDto> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        name: true,
        coverImageUrl: true,
        accentColor: true,
        recipes: {
          select: { recipe: { select: collectionRecipeCardSelect } },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this collection');
    }

    return {
      id: collection.id,
      name: collection.name,
      coverImageUrl: collection.coverImageUrl,
      accentColor: collection.accentColor,
      recipes: await Promise.all(
        collection.recipes.map(({ recipe }) =>
          this.toCollectionRecipeCard(recipe),
        ),
      ),
    };
  }

  private async toCollectionRecipeCard(
    recipe: CollectionRecipeCardRecord,
  ): Promise<CollectionRecipeCardResponseDto> {
    const [firstImage] = recipe.images;

    return {
      id: recipe.id,
      title: recipe.title,
      imageUrl: firstImage
        ? await this.storageService.getSignedReadUrl(firstImage.s3Key)
        : null,
      time: recipe.time,
      timeUnit: recipe.timeUnit,
      author: recipe.author,
    };
  }

  async create(
    ownerId: string,
    createCollectionDto: CreateCollectionDto,
  ): Promise<CollectionResponseDto> {
    const collection = await this.prisma.collection.create({
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

    return collection;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this collection');
    }

    // `collection_recipes` rows cascade on delete at the database level; the
    // recipes themselves are untouched — only the join rows disappear.
    await this.prisma.collection.delete({ where: { id } });
  }
}
