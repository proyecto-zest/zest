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

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';
import {
  CreatedRecipeResponseDto,
  PaginatedRecipesResponseDto,
  RecipeDetailResponseDto,
  RecipeMetadataResponseDto,
} from './dto/recipe-response.dto';
import { UpdateRecipeImageDto } from './dto/update-recipe-image.dto';
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

  async create(
    createRecipeDto: CreateRecipeDto,
  ): Promise<CreatedRecipeResponseDto> {
    if (!(await this.storageService.objectExists(createRecipeDto.imageKey))) {
      throw new BadRequestException('La imagen indicada no existe en S3');
    }

    return this.prisma.$transaction(async (transaction) => {
      const ingredientIds = createRecipeDto.ingredients.map(
        ({ ingredientId }) => ingredientId,
      );
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
            create: { s3Key: createRecipeDto.imageKey },
          },
        },
        include: createdRecipeInclude,
      });
      return this.toCreatedRecipeResponse(recipe);
    });
  }

  async updateImage(
    id: string,
    updateRecipeImageDto: UpdateRecipeImageDto,
  ): Promise<RecipeDetailResponseDto> {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: recipeDetailInclude,
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (updateRecipeImageDto.imageKey === undefined) {
      return this.toRecipeDetailResponse(recipe);
    }

    const newImageKey = updateRecipeImageDto.imageKey;
    if (!(await this.storageService.objectExists(newImageKey))) {
      throw new BadRequestException('La imagen indicada no existe en S3');
    }

    const previousImageKeys = recipe.images
      .map(({ s3Key }) => s3Key)
      .filter((s3Key) => s3Key !== newImageKey);
    const updatedRecipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        images: {
          deleteMany: {},
          create: { s3Key: newImageKey },
        },
      },
      include: recipeDetailInclude,
    });

    await Promise.all(
      previousImageKeys.map((s3Key) => this.storageService.deleteObject(s3Key)),
    );

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

    const deletions = await Promise.allSettled(
      recipe.images.map(({ s3Key }) => this.storageService.deleteObject(s3Key)),
    );
    deletions.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `No se pudo borrar de S3 la imagen ${recipe.images[index].s3Key}`,
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
      imageUrl: await this.storageService.getSignedReadUrl(
        recipe.images[0].s3Key,
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
}
