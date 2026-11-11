CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- The dictionary is explicitly qualified and must remain unchanged. If its
-- rules change (including a PostgreSQL upgrade), REINDEX these indexes.
CREATE FUNCTION public.search_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

CREATE INDEX recipes_title_search_idx
  ON recipes USING gin (public.search_unaccent(title) public.gin_trgm_ops);
CREATE INDEX ingredients_name_search_idx
  ON ingredients USING gin (public.search_unaccent(name) public.gin_trgm_ops);
CREATE INDEX users_name_search_idx
  ON users USING gin (public.search_unaccent(name) public.gin_trgm_ops);
