-- Do not silently clamp existing entries: invalid data must be reviewed before
-- applying this constraint. The same range applies to accumulated quantities.
ALTER TABLE "planner_entries"
ADD CONSTRAINT "planner_entries_quantity_check"
CHECK ("quantity" >= 1 AND "quantity" <= 100);
