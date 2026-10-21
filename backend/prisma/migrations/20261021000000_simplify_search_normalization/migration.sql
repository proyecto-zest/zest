-- Retire the cross-version fraction compatibility layer. Use PostgreSQL's
-- standard unaccent behavior; accent/case folding remains unchanged.
-- Keep previously applied migrations intact.
CREATE OR REPLACE FUNCTION public.search_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Required for databases that already indexed text using the previous
-- function: expression index values must match the current implementation.
REINDEX INDEX public.recipes_title_search_idx;
REINDEX INDEX public.ingredients_name_search_idx;
REINDEX INDEX public.users_name_search_idx;
