import { Prisma } from '@prisma/client';

import { ListRecipesQueryDto } from './dto/list-recipes-query.dto';

export interface RecipeSearchPage {
  total: number;
  ids: string[];
}

// Prisma's contains/mode filters cannot apply unaccent to the stored column.
// Keep every predicate and pagination in SQL; only the current page's IDs
// leave PostgreSQL. All user input is bound through Prisma.sql parameters.
export function recipeSearchQuery(
  query: ListRecipesQueryDto,
  limit: number,
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
    filters.push(Prisma.sql`EXISTS (
      SELECT 1 FROM recipe_ingredients ri
      JOIN ingredients i ON i.id = ri.ingredient_id
      WHERE ri.recipe_id = r.id
      AND ${containsNormalized(Prisma.sql`i.name`, query.ingredientName)}
    )`);
  }
  for (const ingredientId of query.ingredient ?? []) {
    filters.push(Prisma.sql`EXISTS (
      SELECT 1 FROM recipe_ingredients ri
      WHERE ri.recipe_id = r.id AND ri.ingredient_id = ${ingredientId}::uuid
    )`);
  }
  if (query.category !== undefined) {
    filters.push(Prisma.sql`r.category = ${query.category}::"RecipeCategory"`);
  }
  if (query.difficulty !== undefined) {
    filters.push(
      Prisma.sql`r.difficulty = ${query.difficulty}::"RecipeDifficulty"`,
    );
  }
  if (query.authorId !== undefined) {
    filters.push(Prisma.sql`r.author_id = ${query.authorId}::uuid`);
  }

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

function containsNormalized(column: Prisma.Sql, text: string): Prisma.Sql {
  // Keep the existing partial ILIKE search; normalize BOTH sides so ñ/n
  // and decomposed accents match too. Input remains a bound parameter.
  return Prisma.sql`public.unaccent(${column})
    ILIKE '%' || public.unaccent(${text}::text) || '%'`;
}
