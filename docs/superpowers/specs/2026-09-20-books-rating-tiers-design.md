# Books page: "By rating" tier view

Date: 2026-09-20 Status: Approved (design), pending implementation

## Goal

Add a tier view to `/books/` that groups the reader's books by star rating (5.0, 4.5,
4.0, …) in addition to the existing reading-status grouping. The rating view is a
compact ranking/overview of the collection.

## Context

- The books page is rendered client-side by `assets/js/atproto-books.ts`, which fetches
  the user's `buzz.bookhive.book` records from their PDS (`eurosky.social`) via
  `com.atproto.repo.listRecords`.
- Ratings in BookHive are integers on a 1–10 scale (`stars`), i.e. half-star granularity
  on a 5-star display. `convertToDisplayBook` stores `rating = stars / 2`.
- The page currently groups books by status: Reading, Read, Want to Read, Paused,
  Abandoned, Other.
- Current data shape (snapshot): 72 books, 35 rated (5.0:12, 4.5:1, 4.0:15, 3.5:1,
  3.0:3, 2.5:1, 2.0:1, 1.0:1), 37 unrated.

## Decisions

- **Placement:** tabs on the same page (no new route). A switcher under the `Books (N)`
  heading toggles **By status** (default) and **By rating**. Clicking re-renders from
  already-fetched data.
- **Tab persistence:** the active tab is reflected in the URL hash (`#rating`), so it is
  shareable and survives reload. Absent/unknown hash → By status.
- **Tier contents:** cover grid, with title + author baked into a bottom dark gradient
  overlay on each cover (visual option B).
- **Unrated books:** shown as a final tier labelled **Unrated**, so all books remain
  visible.
- **Empty tiers:** hidden.
- **Order within a tier:** title A–Z.

## Design

### Tabs

Bootstrap `nav-pills` (or equivalent) under the `Books (N)` heading:

```
By status | By rating
```

Active pill uses the theme primary colour; styles must work in light and dark mode.
Keyboard focus and `aria-selected` should be set on the active tab.

### By status view

Unchanged from current behaviour:

- Reading, Read, Want to Read, Paused, Abandoned, Other
- Existing full card grid with cover, review snippet, star rating, progress, tags, ISBN.
- Skip statuses with zero books.
- Each group heading shows its book count.

### By rating view

- Tier order: `5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0`, then `Unrated`.
- Each tier heading renders star icons (full / half / empty, reusing `renderStars`)
  followed by the count, e.g. `★★★★½ (1)`.
- Books are laid out in a responsive CSS grid:
  `grid-template-columns: repeat(auto-fill, minmax(110px, 1fr))` with a sensible gap
  (~1rem).
- Each tile:
  - cover image (portrait, fixed aspect ratio, `object-fit: cover`);
  - a bottom gradient overlay with the title (bold) and author (muted/small);
  - if no cover, a book-icon placeholder using the same overlay treatment.
- Tiers with no books are not rendered.
- Within a tier, books sort by title (locale-aware, case-insensitive).

### Data flow

- `fetchUserBooks()` (existing, now paginated) loads all records once on page load.
- `convertToDisplayBook()` (existing) produces `DisplayBook[]` with `rating` (0.5
  steps), `status`, `coverUrl`, title, authors.
- A module-level `currentView: "status" | "rating"` drives which renderer runs.
- Rendering is split into:
  - `renderByStatus(books)` — existing grouping/card markup.
  - `renderByRating(books)` — new tier grouping/tile markup.
  - Shared helpers: `renderStars(rating)`, `escapeHtml`, `truncate`, `renderTabSwitcher`
    (or inline markup in each render).
- `initBooksPage()` renders the header + tabs + current view; tab clicks update
  `currentView`, the URL hash, and re-render.
- A `hashchange` listener keeps the view in sync with the URL.

### Styling

New rules in `assets/scss/common/_custom.scss`:

- `.books-view-tabs` — pill switcher spacing/active state.
- `.rating-tier` — tier section spacing; `.rating-tier-heading` typography.
- `.cover-grid` — the responsive grid.
- `.cover-tile` — relative positioning, rounded corners, aspect ratio.
- `.cover-tile-overlay` — absolute bottom gradient with title/author.
- `.cover-tile-placeholder` — icon placeholder.
- Dark-mode variants via `@include color-mode(dark)`.

### Error handling

- Existing behaviour preserved: fetch errors are logged and yield an empty list, which
  renders the "No books found" info alert.
- The tab switcher should not be rendered when there are zero books (only the empty
  state).

## Out of scope

- Server-side/Hugo rendering of the books list.
- Filtering, search, sorting controls, or pagination of the rendered grids.
- Changes to the source of truth (BookHive records / PDS).

## Testing

Extend the Node DOM-shim harness used for prior fixes (loads the built
`public/js/atproto-books.js`, stubs `document.getElementById` for `books-app`):

1. **By status (default):** header `Books (72)`; groups include Reading, Read, Want to
   Read, Abandoned; total cards = 72.
2. **By rating:** 9 rating tiers + `Unrated`; total tiles = 72; the 35 rated books split
   across the correct tiers; `Unrated (37)`.
3. **Half stars:** a book with `stars = 7` renders 3 full + 1 half + 1 empty in both
   views.
4. **Tab behaviour:** activating the rating tab switches the rendered markup and sets
   `location.hash`.
5. Verify against the served dev bundle (`/js/atproto-books.js`) rather than only the
   source.
