-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth0_sub" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" VARCHAR,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth0_sub_key" ON "users"("auth0_sub");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Preserve recipes created before Auth0 integration under the temporary author
-- already used by POST /recipes, then make the relationship mandatory.
INSERT INTO "users" (
    "id",
    "auth0_sub",
    "name",
    "email",
    "email_verified"
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    'auth0|zest-default-author',
    'Default Zest User',
    'default-author@zest.local',
    false
);

UPDATE "recipes"
SET "author_id" = '00000000-0000-4000-8000-000000000001';

-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "author_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
