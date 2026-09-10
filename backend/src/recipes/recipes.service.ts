import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  IngredientUnit,
  Prisma,
  RecipeCategory,
  RecipeDifficulty,
  RecipeTimeUnit,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import {
  RecipeImageContentType,
  RecipeImageUploadRequestDto,
  RecipeImageUploadResponseDto,
} from './dto/recipe-image-upload.dto';
import {
  CreatedRecipeResponseDto,
  PaginatedRecipesResponseDto,
  RecipeDetailResponseDto,
  RecipeMetadataResponseDto,
} from './dto/recipe-response.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {
  DEFAULT_RECIPE_AUTHOR_ID,
  MAX_RECIPES_LIMIT,
} from './recipes.constants';

const createdRecipeInclude = {
  ingredients: {
    include: { ingredient: true },
  },
  steps: {
    orderBy: { stepNumber: 'asc' },
  },
  images: {
    select: { s3Key: true },
  },
} satisfies Prisma.RecipeInclude;

const recipeCardSelect = {
  id: true,
  title: true,
  category: true,
  difficulty: true,
  time: true,
  servings: true,
  images: {
    select: { s3Key: true },
  },
} satisfies Prisma.RecipeSelect;

const recipeDetailInclude = {
  ingredients: {
    include: { ingredient: true },
  },
  steps: {
    orderBy: { stepNumber: 'asc' },
  },
  images: {
    select: { s3Key: true },
  },
} satisfies Prisma.RecipeInclude;

type CreatedRecipeRecord = Prisma.RecipeGetPayload<{
  include: typeof createdRecipeInclude;
}>;

type RecipeDetailRecord = Prisma.RecipeGetPayload<{
  include: typeof recipeDetailInclude;
}>;

const imageExtensionByContentType: Record<RecipeImageContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  getMetadata(): RecipeMetadataResponseDto {
    return {
      categories: Object.values(RecipeCategory),
      difficulties: Object.values(RecipeDifficulty),
      units: Object.values(IngredientUnit),
      timeUnits: Object.values(RecipeTimeUnit),
    };
  }

  async findAll(
    query: ListRecipesQueryDto,
  ): Promise<PaginatedRecipesResponseDto> {
    const page = query.page;
    const limit = Math.min(query.limit, MAX_RECIPES_LIMIT);
    const filters: Prisma.RecipeWhereInput[] = [];

    if (query.name !== undefined) {
      filters.push({
        title: { contains: query.name, mode: 'insensitive' },
      });
    }

    for (const ingredientId of query.ingredient ?? []) {
      filters.push({
        ingredients: { some: { ingredientId } },
      });
    }

    if (query.category !== undefined) {
      filters.push({ category: query.category });
    }

    if (query.difficulty !== undefined) {
      filters.push({ difficulty: query.difficulty });
    }

    const where: Prisma.RecipeWhereInput =
      filters.length > 0 ? { AND: filters } : {};
    const [total, recipes] = await Promise.all([
      this.prisma.recipe.count({ where }),
      this.prisma.recipe.findMany({
        where,
        select: recipeCardSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      recipes: await Promise.all(
        recipes.map(async ({ images, ...recipe }) => ({
          ...recipe,
          imageUrls: await Promise.all(
            images.map(({ s3Key }) =>
              this.storageService.getSignedReadUrl(s3Key),
            ),
          ),
        })),
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<RecipeDetailResponseDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: recipeDetailInclude,
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return this.toRecipeDetailResponse(recipe);
  }

  async createImageUploadUrl(
    requestDto: RecipeImageUploadRequestDto,
  ): Promise<RecipeImageUploadResponseDto> {
    const extension = imageExtensionByContentType[requestDto.contentType];
    const imageKey = `recipes/${randomUUID()}.${extension}`;

    return {
      uploadUrl: await this.storageService.getSignedUploadUrl(
        imageKey,
        requestDto.contentType,
      ),
      imageKey,
    };
  }

  async create(
    createRecipeDto: CreateRecipeDto,
  ): Promise<CreatedRecipeResponseDto> {
    const imageKeys = createRecipeDto.imageKeys ?? [];
    await this.assertImagesExist(imageKeys);

    return this.prisma.$transaction(async (transaction) => {
      await this.assertIngredientsExist(
        transaction,
        createRecipeDto.ingredients.map(({ ingredientId }) => ingredientId),
      );

      const recipe = await transaction.recipe.create({
        data: {
          authorId: DEFAULT_RECIPE_AUTHOR_ID,
          title: createRecipeDto.title,
          description: createRecipeDto.description,
          category: createRecipeDto.category,
          time: createRecipeDto.time,
          timeUnit: createRecipeDto.timeUnit,
          difficulty: createRecipeDto.difficulty,
          servings: createRecipeDto.servings,
          ingredients: {
            create: createRecipeDto.ingredients.map(
              ({ ingredientId, amount, unit }) => ({
                ingredientId,
                amount,
                unit,
              }),
            ),
          },
          steps: {
            create: createRecipeDto.steps.map((text, index) => ({
              stepNumber: index + 1,
              text,
            })),
          },
          images: {
            create: imageKeys.map((s3Key) => ({ s3Key })),
          },
        },
        include: createdRecipeInclude,
      });
      return this.toCreatedRecipeResponse(recipe);
    });
  }

  async update(
    id: string,
    updateRecipeDto: UpdateRecipeDto,
  ): Promise<RecipeDetailResponseDto> {
    // TODO: validar que el usuario autenticado sea el autor de la receta.
    const currentRecipe = await this.prisma.recipe.findUnique({
      where: { id },
      select: { images: { select: { s3Key: true } } },
    });

    if (!currentRecipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (updateRecipeDto.imageKeys !== undefined) {
      await this.assertImagesExist(updateRecipeDto.imageKeys);
    }

    const { updatedRecipe, deletedImageKeys } = await this.prisma.$transaction(
      async (transaction) => {
        const ingredientIds = updateRecipeDto.ingredients.map(
          ({ ingredientId }) => ingredientId,
        );
        await this.assertIngredientsExist(transaction, ingredientIds);

        const currentIngredients = await transaction.recipeIngredient.findMany({
          where: { recipeId: id },
          select: { ingredientId: true, amount: true, unit: true },
        });
        const currentIngredientsById = new Map(
          currentIngredients.map((ingredient) => [
            ingredient.ingredientId,
            ingredient,
          ]),
        );
        const newIngredients = updateRecipeDto.ingredients.filter(
          ({ ingredientId }) => !currentIngredientsById.has(ingredientId),
        );
        const changedIngredients = updateRecipeDto.ingredients.filter(
          ({ ingredientId, amount, unit }) => {
            const currentIngredient = currentIngredientsById.get(ingredientId);
            return (
              currentIngredient !== undefined &&
              (currentIngredient.amount !== amount ||
                currentIngredient.unit !== unit)
            );
          },
        );

        await transaction.recipe.update({
          where: { id },
          data: {
            title: updateRecipeDto.title,
            description: updateRecipeDto.description,
            category: updateRecipeDto.category,
            time: updateRecipeDto.time,
            timeUnit: updateRecipeDto.timeUnit,
            difficulty: updateRecipeDto.difficulty,
            servings: updateRecipeDto.servings,
          },
        });

        await transaction.recipeIngredient.deleteMany({
          where: {
            recipeId: id,
            ingredientId: { notIn: ingredientIds },
          },
        });
        if (newIngredients.length > 0) {
          await transaction.recipeIngredient.createMany({
            data: newIngredients.map(({ ingredientId, amount, unit }) => ({
              recipeId: id,
              ingredientId,
              amount,
              unit,
            })),
          });
        }
        for (const ingredient of changedIngredients) {
          await transaction.recipeIngredient.update({
            where: {
              recipeId_ingredientId: {
                recipeId: id,
                ingredientId: ingredient.ingredientId,
              },
            },
            data: { amount: ingredient.amount, unit: ingredient.unit },
          });
        }

        await transaction.recipeStep.deleteMany({ where: { recipeId: id } });
        await transaction.recipeStep.createMany({
          data: updateRecipeDto.steps.map((text, index) => ({
            recipeId: id,
            stepNumber: index + 1,
            text,
          })),
        });

        let deletedImageKeys: string[] = [];
        if (updateRecipeDto.imageKeys !== undefined) {
          deletedImageKeys = currentRecipe.images
            .map(({ s3Key }) => s3Key)
            .filter((s3Key) => !updateRecipeDto.imageKeys?.includes(s3Key));
          await transaction.recipeImage.deleteMany({ where: { recipeId: id } });
          if (updateRecipeDto.imageKeys.length > 0) {
            await transaction.recipeImage.createMany({
              data: updateRecipeDto.imageKeys.map((s3Key) => ({
                recipeId: id,
                s3Key,
              })),
            });
          }
        }

        const updatedRecipe = await transaction.recipe.findUniqueOrThrow({
          where: { id },
          include: recipeDetailInclude,
        });

        return { updatedRecipe, deletedImageKeys };
      },
    );

    const imageKeysToDelete = await this.getUnreferencedImageKeys(
      id,
      deletedImageKeys,
    );
    await this.deleteImagesSafely(imageKeysToDelete);

    return this.toRecipeDetailResponse(updatedRecipe);
  }

  async remove(id: string): Promise<void> {
    // TODO: validar que el usuario autenticado sea el autor de la receta.
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      select: { images: { select: { s3Key: true } } },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.recipeIngredient.deleteMany({
        where: { recipeId: id },
      });
      await transaction.recipeStep.deleteMany({ where: { recipeId: id } });
      await transaction.recipeImage.deleteMany({ where: { recipeId: id } });
      await transaction.recipe.delete({ where: { id } });
    });

    const imageKeysToDelete = await this.getUnreferencedImageKeys(
      id,
      recipe.images.map(({ s3Key }) => s3Key),
    );
    await this.deleteImagesSafely(imageKeysToDelete);
  }

  private async deleteImagesSafely(imageKeys: string[]): Promise<void> {
    const deletions = await Promise.allSettled(
      imageKeys.map((s3Key) => this.storageService.deleteObject(s3Key)),
    );
    deletions.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `No se pudo borrar de S3 la imagen ${imageKeys[index]}`,
          result.reason instanceof Error ? result.reason.stack : undefined,
        );
      }
    });
  }

  private async toCreatedRecipeResponse(
    recipe: CreatedRecipeRecord,
  ): Promise<CreatedRecipeResponseDto> {
    return {
      id: recipe.id,
      authorId: recipe.authorId,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      time: recipe.time,
      timeUnit: recipe.timeUnit,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      ingredients: recipe.ingredients.map((recipeIngredient) => ({
        recipeId: recipeIngredient.recipeId,
        ingredientId: recipeIngredient.ingredientId,
        amount: recipeIngredient.amount,
        unit: recipeIngredient.unit,
        ingredient: {
          id: recipeIngredient.ingredient.id,
          name: recipeIngredient.ingredient.name,
        },
      })),
      steps: recipe.steps.map((step) => ({
        id: step.id,
        recipeId: step.recipeId,
        stepNumber: step.stepNumber,
        text: step.text,
      })),
      imageUrls: await Promise.all(
        recipe.images.map(({ s3Key }) =>
          this.storageService.getSignedReadUrl(s3Key),
        ),
      ),
    };
  }

  private async toRecipeDetailResponse(
    recipe: RecipeDetailRecord,
  ): Promise<RecipeDetailResponseDto> {
    return {
      id: recipe.id,
      authorId: recipe.authorId,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      time: recipe.time,
      timeUnit: recipe.timeUnit,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      ingredients: recipe.ingredients.map((recipeIngredient) => ({
        recipeId: recipeIngredient.recipeId,
        ingredientId: recipeIngredient.ingredientId,
        amount: recipeIngredient.amount,
        unit: recipeIngredient.unit,
        ingredient: {
          id: recipeIngredient.ingredient.id,
          name: recipeIngredient.ingredient.name,
        },
      })),
      steps: recipe.steps.map((step) => ({
        id: step.id,
        recipeId: step.recipeId,
        stepNumber: step.stepNumber,
        text: step.text,
      })),
      imageUrls: await Promise.all(
        recipe.images.map(({ s3Key }) =>
          this.storageService.getSignedReadUrl(s3Key),
        ),
      ),
    };
  }

  private async assertImagesExist(imageKeys: string[]): Promise<void> {
    const existence = await Promise.all(
      imageKeys.map((imageKey) => this.storageService.objectExists(imageKey)),
    );
    const missingImageKeys = imageKeys.filter((_, index) => !existence[index]);

    if (missingImageKeys.length > 0) {
      throw new BadRequestException(
        `Las siguientes imágenes no existen en S3: ${missingImageKeys.join(', ')}`,
      );
    }
  }

  private async getUnreferencedImageKeys(
    recipeId: string,
    imageKeys: string[],
  ): Promise<string[]> {
    const uniqueImageKeys = [...new Set(imageKeys)];
    if (uniqueImageKeys.length === 0) {
      return [];
    }

    const sharedImages = await this.prisma.recipeImage.findMany({
      where: {
        s3Key: { in: uniqueImageKeys },
        recipeId: { not: recipeId },
      },
      select: { s3Key: true },
    });
    const sharedImageKeys = new Set(sharedImages.map(({ s3Key }) => s3Key));

    return uniqueImageKeys.filter((s3Key) => !sharedImageKeys.has(s3Key));
  }

  private async assertIngredientsExist(
    transaction: Prisma.TransactionClient,
    ingredientIds: string[],
  ): Promise<void> {
    const existingIngredients = await transaction.ingredient.findMany({
      where: { id: { in: ingredientIds } },
      select: { id: true },
    });

    if (existingIngredients.length !== ingredientIds.length) {
      const existingIds = new Set(
        existingIngredients.map((ingredient) => ingredient.id),
      );
      const missingIds = ingredientIds.filter((id) => !existingIds.has(id));

      throw new BadRequestException(
        `Los siguientes ingredientes no existen: ${missingIds.join(', ')}`,
      );
    }
  }
}
