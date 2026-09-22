# Books page: "Owned" ownership mark (outlined pill)

Date: 2026-09-22 Status: Approved (design), pending implementation

## Goal

Replace the muted grey `Owned` text line on book cards with a quiet outlined pill —
`bi-book` glyph + "Owned" — anchored to the bottom-right of the card body.

## Context

- The books page is rendered client-side by `assets/js/atproto-books.ts`, which fetches
  `buzz.bookhive.book` records from the user's PDS.
- The `owned` boolean is already plumbed end-to-end: lexicon interface →
  `DisplayBook.owned` → `convertToDisplayBook()`.
- Today it renders as `<small style="...">Owned</small>` inside the meta stack of the
  "By status" card (`renderBookCard`).
- Design was iterated in the visual companion: rubber-stamp treatments and cover
  overlays were rejected; the chosen direction is a minimal outlined pill with a book
  glyph, placed in the card body's lower-right corner.

## Decisions

- **Shape:** outlined pill — rounded border, `bi-book` icon + visible "Owned" text,
  muted secondary colour. No ink/stamp styling.
- **Placement:** absolute bottom-right of the card body in the "By status" view only.
  The rating view's compact cover tiles are unchanged (no body space).
- **Theming:** Bootstrap CSS variables only, so light and dark modes both work. The pill
  carries the card background so wrapped tags can never visually collide with it.
- **Accessibility:** the word "Owned" is visible text (its own accessible name); a
  `title="Owned"` attribute adds hover affordance.
- **Markup scoping:** the card wrapper gets a `book-card` class so the required
  `position: relative` on `.card-body` does not leak to other cards on the site.

## Design

### Markup (`renderBookCard`, atproto-books.ts)

Remove the current owned `<small>` block and render, only when `book.owned` is true:

```html
<span class="owned-pill" title="Owned"><i class="bi bi-book"></i>Owned</span>
```

Also add `book-card` to the card wrapper's class list (`<div class="card shadow-sm">` →
`<div class="card shadow-sm book-card">`).

### Styling (`assets/scss/common/_custom.scss`, books section)

```
.book-card .card-body   { position: relative; }

.owned-pill {
  position: absolute; right: .75rem; bottom: .75rem;
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .15rem .6rem;
  border: 1.5px solid var(--bs-border-color); border-radius: 50rem;
  background-color: var(--bs-card-bg);
  color: var(--bs-secondary-color);
  font-size: .72rem; font-weight: 600; letter-spacing: .02em;
  i { font-size: .85rem; line-height: 1; }
}
```

Exact spacing/typography values may be nudged during implementation to match the
approved mockup's proportions; the colour contract (theme variables, no hardcoded
colours) is fixed.

### Data flow

Unchanged — `owned` already flows from record to `DisplayBook`.

### Error handling

Unchanged — no new failure modes; absent/undefined `owned` simply renders no pill.

## Out of scope

- Owned mark in the rating/cover-tile view.
- The dead `paused` status and `tags` code paths (known schema drift, separate fix).
- Any changes to BookHive records or the PDS.

## Testing

Extend the existing Node DOM-shim harness used for the rating-tiers work (loads the
built `public/js/atproto-books.js`, stubs `document.getElementById` for `books-app`):

1. **Owned book:** renders exactly one `.owned-pill`, containing a `bi-book` icon and
   the text "Owned".
2. **Non-owned book:** renders zero `.owned-pill` elements.
3. **No regression:** the old `<small …>Owned</small>` markup is gone; status grouping,
   stars, progress, and ISBN rendering are unchanged.
4. Verify against the built bundle (`public/js/atproto-books.js`), not only source.
5. `pnpm build` (or the project's standard build) completes without SCSS/TS errors.
