# components/ui/

Small, reusable UI primitives with no domain knowledge of recipes, collections,
etc. — buttons, form fields, modal, toast. If a component needs to know what a
"recipe" or "ingredient" is, it doesn't belong here; put it in the owning
`features/*` folder instead (e.g. `features/recipe-create/sections/`).

`components/` (one level up) is for pieces that *are* Zest-specific but still
shared across features — `Card`, `Logo`. `components/nav/` is the site chrome
(header, bottom nav) specifically.

## File layout

- **Flat `PascalCase.tsx`** is the default: one component, one file, matching
  filename. Most of `ui/` looks like this (`Button.tsx`, `TextField.tsx`,
  `Modal.tsx`, ...).
- **Folder-per-component** (`alert/`, `toast/`) only once a component actually
  splits into multiple co-located files — sub-components, a variants map, a
  context/hook — with an `index.ts` barrel re-exporting the public API. Don't
  pre-create a folder for a component that's still one file; convert it when
  the second file shows up.

## Variants

Prefer a `<name>Variants.ts` file exporting a plain class-builder function
(see `buttonVariants.ts`, `alert/alertVariants.ts`) over prop-driven inline
ternaries, once a component has more than one visual variant. It's what lets
non-`<button>` elements that need the same look (e.g. `NewRecipeButton`'s
`<Link>`) share the exact classes instead of copying them.
