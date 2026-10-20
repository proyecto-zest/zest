-- PostgreSQL 16 and 17 expand fraction characters differently (1/4 vs " 1/4").
-- Expand these explicitly before unaccent so search and its indexes have the
-- same semantics on both versions and match the frontend dictionary.
CREATE OR REPLACE FUNCTION public.search_unaccent(text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE PARALLEL SAFE STRICT
AS $function$
DECLARE
  normalized text := $1;
BEGIN
  IF normalized ~ '[¼½¾⅐-⅟↉]' THEN
    normalized := replace(normalized, $$¼$$, $$ 1/4$$);
    normalized := replace(normalized, $$½$$, $$ 1/2$$);
    normalized := replace(normalized, $$¾$$, $$ 3/4$$);
    normalized := replace(normalized, $$⅐$$, $$ 1/7$$);
    normalized := replace(normalized, $$⅑$$, $$ 1/9$$);
    normalized := replace(normalized, $$⅒$$, $$ 1/10$$);
    normalized := replace(normalized, $$⅓$$, $$ 1/3$$);
    normalized := replace(normalized, $$⅔$$, $$ 2/3$$);
    normalized := replace(normalized, $$⅕$$, $$ 1/5$$);
    normalized := replace(normalized, $$⅖$$, $$ 2/5$$);
    normalized := replace(normalized, $$⅗$$, $$ 3/5$$);
    normalized := replace(normalized, $$⅘$$, $$ 4/5$$);
    normalized := replace(normalized, $$⅙$$, $$ 1/6$$);
    normalized := replace(normalized, $$⅚$$, $$ 5/6$$);
    normalized := replace(normalized, $$⅛$$, $$ 1/8$$);
    normalized := replace(normalized, $$⅜$$, $$ 3/8$$);
    normalized := replace(normalized, $$⅝$$, $$ 5/8$$);
    normalized := replace(normalized, $$⅞$$, $$ 7/8$$);
    normalized := replace(normalized, $$⅟$$, $$ 1/$$);
    normalized := replace(normalized, $$↉$$, $$ 0/3$$);
  END IF;
  RETURN public.unaccent('public.unaccent'::regdictionary, normalized);
END;
$function$;

-- The function's output changed: refresh existing expression indexes.
REINDEX INDEX public.recipes_title_search_idx;
REINDEX INDEX public.ingredients_name_search_idx;
REINDEX INDEX public.users_name_search_idx;
