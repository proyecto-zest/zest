-- CreateTable
CREATE TABLE "planner_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "planner_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planner_entries_user_id_date_idx" ON "planner_entries"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "planner_entries_user_id_recipe_id_date_key" ON "planner_entries"("user_id", "recipe_id", "date");

-- AddForeignKey
ALTER TABLE "planner_entries" ADD CONSTRAINT "planner_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner_entries" ADD CONSTRAINT "planner_entries_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
