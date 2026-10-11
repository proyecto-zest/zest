# Live demo script

Live demo on production, using the realistic recipe seed (ZEST-82) and the
front-end QA (ZEST-84). Rehearsal on production is tracked in ZEST-104.

## What is in `main` (what we can show)

| Flow | Status | Notes |
|---|---|---|
| Recipe feed with search and filters | In `main` | name, ingredient, difficulty, category, pagination |
| Recipe detail | In `main` | gallery, ingredients, steps |
| Create recipe with image | In `main` | upload goes straight to S3 |
| Edit / delete recipe | In `main` | optional, keep out of the main path |
| Login / signup, author on cards | Needs `dev` → `main` | not in `main` today |
| Collections: list, create, delete | Needs `dev` → `main` | detail page is still a placeholder |
| "Add recipe to collection" modal | Not built in the frontend | leave out |

Anything marked "Needs `dev` → `main`" is only part of the demo if the merge
happens before the rehearsal. Otherwise cut that part and keep the rest.

## Before going on stage (checklist)

1. Wake the backend 5 minutes before: `curl https://zest-backend-ozgu.onrender.com/health`.
   Render's free plan sleeps after 15 minutes without traffic and takes about a
   minute to wake up. Keep the tab of the feed open and refresh once.
2. Production database has all migrations applied and the seed was run
   (`npx prisma db seed` against the Neon direct URL; it is idempotent).
3. Re-upload the 2 missing seed photos (they return 404 in S3):
   `recipes/65368949-0910-45af-a0c5-82bd49923f53.jpg` (Berry Yogurt Parfait) and
   `recipes/cfead0ba-d5c8-4af3-b61c-2c5f78d659bb.webp` (Classic Hummus with Pita).
4. Demo account created in Auth0 and logged in once, in a clean browser profile.
5. A food photo (jpg, png or webp; keep it small so the upload is fast) saved on
   the desktop for the create flow.
6. `CORS_ORIGIN` in Render matches the frontend domain.

## Accounts and data

| Item | Value |
|---|---|
| Presenter account | one Auth0 test user (create it in the Auth0 dashboard) |
| Seed authors | Santiago, Tiago, Ines (10 recipes each, cannot log in) |
| Seed size | 30 recipes: 13 easy, 11 medium, 6 hard |

## Order, timing and presenter

| # | Part | Time | Presenter |
|---|---|---|---|
| 1 | Intro and product pitch | 1 min | Presenter 1 |
| 2 | Feed: search and filters | 3 min | Presenter 2 |
| 3 | Recipe detail | 2 min | Presenter 2 |
| 4 | Create a recipe with an image | 3 min | Presenter 3 |
| 5 | Collections (if merged) | 2 min | Presenter 3 |
| 6 | Closing and architecture | 1 min | Presenter 1 |

Total: about 12 minutes. Assign real names before the rehearsal.

## Step by step

### 2. Feed: search and filters

1. Open the home page. Say: 30 recipes with photos, authors and cooking time;
   20 per page.
2. Search `chicken`: 4 results (Mango Chicken with Rice, Chicken Tacos with
   Avocado Salsa, Lemon Herb Roast Chicken, Chicken and Vegetable Couscous).
3. Clear it. Filter by difficulty Easy and search `salad`: 3 results (Classic
   Caprese Salad 15 min, Mediterranean Chickpea Salad 20 min, Fresh Fruit
   Salad 20 min).
4. Filter by ingredient `tomato`: 7 recipes. Say: the ingredient filter uses the
   catalog of 360 ingredients.

Plan B: if the feed shows "Couldn't load recipes", wait 60 seconds and refresh
(cold start). If it still fails, show the recorded clip of this flow.

### 3. Recipe detail

1. Open **Classic Beef Lasagna** (Tiago, 2 photos).
2. Show the gallery, the author, the ingredient list with amounts and the steps.

Plan B: open **Chicken and Vegetable Couscous** (6 steps) from the feed.

### 4. Create a recipe with an image

1. Go to **New recipe**. Title `Lemon Garlic Pasta`, short description,
   category Dinner, time 25 minutes, difficulty Easy, 2 servings.
2. Add 3 ingredients from the catalog (`garlic`, `olive oil`, `lemon juice`)
   with amounts, and 3 steps.
3. Drop the prepared photo and submit. Say: the photo goes straight to S3 and
   the backend only issues a signed URL.
4. Back on the feed the new recipe shows first (newest first).

Plan B: if the image upload fails, remove the photo and create the recipe
without it. If creation fails, open a recipe prepared in the rehearsal.

### 5. Collections (only if `dev` is merged)

1. Open **My Collections** and create a collection `Quick dinners`.
2. Show that it appears with its accent color and recipe count.
3. Delete a spare collection to show the confirmation modal.

Plan B: skip this part; it is the first thing to cut if time is short.

## Known gaps (do not show)

- Collection detail page is a placeholder.
- There is no "Add recipe to collection" modal in the frontend yet.
- The collection cover still uses the 8 fixed photos until ZEST-99 is merged on
  both backend and frontend.

## Open decisions

- Final list of flows once the `dev` → `main` merge date is known.
- Presenter names and the real demo date.
