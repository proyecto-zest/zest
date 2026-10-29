import { Prisma } from '@prisma/client';

import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';

export interface RecipeSearchPage {
  total: number;
  ids: string[];
}

// Define each structured filter once, with both required representations.
// The typed feed and accent-insensitive search consume this same definition.
export function buildRecipeStructuredFilters(query: ListRecipesQueryDto): {
  where: Prisma.RecipeWhereInput;
  sql: Prisma.Sql[];
} {
  const filters: { where: Prisma.RecipeWhereInput; sql: Prisma.Sql }[] = [];

  for (const ingredientId of query.ingredient ?? []) {
    filters.push({
      where: { ingredients: { some: { ingredientId } } },
      sql: hasIngredient(Prisma.sql`ri.ingredient_id = ${ingredientId}::uuid`),
    });
  }
  if (query.category !== undefined) {
    filters.push({
      where: { category: query.category },
      sql: Prisma.sql`r.category = ${query.category}::"RecipeCategory"`,
    });
  }
  if (query.difficulty !== undefined) {
    filters.push({
      where: { difficulty: query.difficulty },
      sql: Prisma.sql`r.difficulty = ${query.difficulty}::"RecipeDifficulty"`,
    });
  }
  if (query.authorId !== undefined) {
    filters.push({
      where: { authorId: query.authorId },
      sql: Prisma.sql`r.author_id = ${query.authorId}::uuid`,
    });
  }

  return {
    where: filters.length ? { AND: filters.map(({ where }) => where) } : {},
    sql: filters.map(({ sql }) => sql),
  };
}

// Prisma's contains/mode filters cannot apply unaccent to the stored column.
// Keep every predicate and pagination in SQL; only the current page's IDs
// leave PostgreSQL. All user input is bound through Prisma.sql parameters.
export function recipeSearchQuery(
  query: ListRecipesQueryDto,
  limit: number,
  structuredFilters: Prisma.Sql[],
): Prisma.Sql {
  const filters: Prisma.Sql[] = [];

  if (query.name) {
    filters.push(containsNormalized(Prisma.sql`r.title`, query.name));
  }
  if (query.author) {
    filters.push(Prisma.sql`EXISTS (
      SELECT 1 FROM users u WHERE u.id = r.author_id
      AND ${containsNormalized(Prisma.sql`u.name`, query.author)}
    )`);
  }
  if (query.ingredientName) {
    filters.push(
      hasIngredient(Prisma.sql`ri.ingredient_id IN (
      SELECT i.id FROM ingredients i
      WHERE ${containsNormalized(Prisma.sql`i.name`, query.ingredientName)}
    )`),
    );
  }
  filters.push(...structuredFilters);

  const where = filters.length
    ? Prisma.join(filters, ' AND ')
    : Prisma.sql`TRUE`;
  return Prisma.sql`
    WITH matches AS (
      SELECT r.id, r.created_at FROM recipes r WHERE ${where}
    )
    SELECT
      (SELECT COUNT(*)::integer FROM matches) AS total,
      ARRAY(
        SELECT id FROM matches ORDER BY created_at DESC, id DESC
        LIMIT ${limit} OFFSET ${(query.page - 1) * limit}
      ) AS ids
  `;
}

function hasIngredient(predicate: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`EXISTS (
    SELECT 1 FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id AND ${predicate}
  )`;
}

function containsNormalized(column: Prisma.Sql, text: string): Prisma.Sql {
  // Escape AFTER unaccent too: its dictionary can expand full-width characters
  // into LIKE metacharacters. "!" is the explicit escape character.
  return Prisma.sql`public.search_unaccent(${column}) ILIKE
    '%' || replace(replace(replace(
      public.search_unaccent(${text}::text), '!', '!!'), '%', '!%'), '_', '!_')
    || '%' ESCAPE '!'`;
}
