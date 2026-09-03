-- CreateEnum
CREATE TYPE "RecipeTimeUnit" AS ENUM ('MINUTOS', 'HORAS');

-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('FACIL', 'MEDIA', 'DIFICIL');

-- CreateEnum
CREATE TYPE "IngredientUnit" AS ENUM ('SIN_UNIDAD', 'UNIDAD', 'GRAMO', 'KILOGRAMO', 'MILILITRO', 'LITRO', 'CUCHARADITA', 'CUCHARADA', 'TAZA', 'ONZA', 'LIBRA', 'PIZCA', 'DIENTE', 'LATA', 'PAQUETE', 'A_GUSTO');

-- Add time unit. Existing values were stored in minutes.
ALTER TABLE "recipes"
ADD COLUMN "time_unit" "RecipeTimeUnit" NOT NULL DEFAULT 'MINUTOS';

ALTER TABLE "recipes"
ALTER COLUMN "time_unit" DROP DEFAULT;

-- Convert existing difficulty text values to the fixed options.
ALTER TABLE "recipes"
ALTER COLUMN "difficulty" TYPE "RecipeDifficulty"
USING (
  CASE UPPER(TRIM("difficulty"))
    WHEN 'FACIL' THEN 'FACIL'
    WHEN 'EASY' THEN 'FACIL'
    WHEN 'MEDIA' THEN 'MEDIA'
    WHEN 'MEDIO' THEN 'MEDIA'
    WHEN 'INTERMEDIA' THEN 'MEDIA'
    WHEN 'MEDIUM' THEN 'MEDIA'
    WHEN 'DIFICIL' THEN 'DIFICIL'
    WHEN 'HARD' THEN 'DIFICIL'
    ELSE 'MEDIA'
  END
)::"RecipeDifficulty";

-- Add ingredient unit. Legacy free-text amounts remain valid and unmodified.
ALTER TABLE "recipe_ingredients"
ADD COLUMN "unit" "IngredientUnit" NOT NULL DEFAULT 'SIN_UNIDAD';

ALTER TABLE "recipe_ingredients"
ALTER COLUMN "unit" DROP DEFAULT;

-- Store infrastructure-independent S3 keys instead of complete URLs.
ALTER TABLE "recipe_images"
RENAME COLUMN "image_url" TO "s3_key";

UPDATE "recipe_images"
SET "s3_key" = 'recipes/default.webp'
WHERE "s3_key" = 'https://placehold.co/1200x800?text=Zest+Recipe';

-- CreateIndex
CREATE INDEX "recipe_images_recipe_id_idx" ON "recipe_images"("recipe_id");
