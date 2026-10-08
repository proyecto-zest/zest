-- AlterTable
ALTER TABLE "collections" DROP COLUMN "cover_image_url",
ADD COLUMN     "cover_image_key" VARCHAR;
