import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { RecipeImageUploadRequestDto } from '../recipes/dto/recipe-image-upload.dto';
import { StorageService } from '../storage/storage.service';
import {
  CollectionDetailResponseDto,
  CollectionListItemResponseDto,
  CollectionRecipeCardResponseDto,
  CollectionResponseDto,
} from './dto/collection-response.dto';
import { CollectionCoverUploadResponseDto } from './dto/collection-cover-upload.dto';
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

const coverExtensionByContentType: Record<
  RecipeImageUploadRequestDto['contentType'],
  string
> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

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
        coverImageKey: true,
        accentColor: true,
        _count: { select: { recipes: true } },
        ...(recipeId !== undefined
          ? { recipes: { where: { recipeId }, select: { recipeId: true } } }
          : {}),
      },
      orderBy: { id: 'asc' },
    });

    return Promise.all(
      collections.map(async ({ _count, recipes, coverImageKey, ...rest }) => ({
        ...rest,
        coverImageUrl: await this.toCoverImageUrl(coverImageKey),
        recipeCount: _count.recipes,
        ...(recipeId !== undefined
          ? {
              containsRecipe:
                (recipes as Array<{ recipeId: string }> | undefined)?.length ===
                1,
            }
          : {}),
      })),
    );
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
        coverImageKey: true,
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
      coverImageUrl: await this.toCoverImageUrl(collection.coverImageKey),
      accentColor: collection.accentColor,
      recipes: await Promise.all(
        collection.recipes.map(({ recipe }) =>
          this.toCollectionRecipeCard(recipe),
        ),
      ),
    };
  }

  async createCoverUploadUrl(
    requestDto: RecipeImageUploadRequestDto,
  ): Promise<CollectionCoverUploadResponseDto> {
    const extension = coverExtensionByContentType[requestDto.contentType];
    const coverImageKey = `collections/${randomUUID()}.${extension}`;

    return {
      uploadUrl: await this.storageService.getSignedUploadUrl(
        coverImageKey,
        requestDto.contentType,
      ),
      coverImageKey,
    };
  }

  async create(
    ownerId: string,
    createCollectionDto: CreateCollectionDto,
  ): Promise<CollectionResponseDto> {
    const coverImageKey = createCollectionDto.coverImageKey ?? null;

    if (coverImageKey !== null) {
      await this.assertCoverExists(coverImageKey);
    }

    const collection = await this.prisma.collection.create({
      data: {
        ownerId,
        name: createCollectionDto.name,
        coverImageKey,
        accentColor: createCollectionDto.accentColor,
      },
      select: {
        id: true,
        name: true,
        coverImageKey: true,
        accentColor: true,
      },
    });

    return {
      id: collection.id,
      name: collection.name,
      coverImageUrl: await this.toCoverImageUrl(collection.coverImageKey),
      accentColor: collection.accentColor,
    };
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      select: { ownerId: true, coverImageKey: true },
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

    if (collection.coverImageKey !== null) {
      await this.deleteCoverSafely(collection.coverImageKey);
    }
  }

  private async toCoverImageUrl(key: string | null): Promise<string | null> {
    return key === null ? null : this.storageService.getSignedReadUrl(key);
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

  private async assertCoverExists(coverImageKey: string): Promise<void> {
    if (!(await this.storageService.objectExists(coverImageKey))) {
      throw new BadRequestException(
        `Las siguientes imágenes no existen en S3: ${coverImageKey}`,
      );
    }
  }

  private async deleteCoverSafely(coverImageKey: string): Promise<void> {
    const stillReferenced = await this.prisma.collection.count({
      where: { coverImageKey },
    });

    if (stillReferenced > 0) {
      return;
    }

    try {
      await this.storageService.deleteObject(coverImageKey);
    } catch (error) {
      this.logger.error(
        `No se pudo borrar de S3 la portada ${coverImageKey}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
