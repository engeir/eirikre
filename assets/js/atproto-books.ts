// BookHive AT Protocol integration
// Uses buzz.bookhive.book lexicon from bookhive.buzz

// BookHive book record type (from actual lexicon)
interface BookHiveBookRecord {
  $type: "buzz.bookhive.book";
  title: string;
  authors: string;
  cover?: {
    ref: { $link: string };
    size: number;
    mimeType: string;
  };
  stars?: number; // 1-10 scale
  status?: string; // e.g., "buzz.bookhive.defs#reading"
  hiveId?: string;
  hiveBookUri?: string;
  identifiers?: {
    hiveId: string;
    goodreadsId?: string;
    isbn10?: string;
    isbn13?: string;
  };
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
  review?: string;
  tags?: string[];
  bookProgress?: {
    percent: number;
    updatedAt: string;
    totalPages?: number;
    currentPage?: number;
  };
}

// BookHive catalog book (referenced by hiveBookUri)
interface BookHiveCatalogBook {
  $type: "buzz.bookhive.catalogBook";
  title: string;
  authors: string[];
  description?: string;
  publishedDate?: string;
  publisher?: string;
  isbn?: string;
  pageCount?: number;
  categories?: string[];
  cover?: {
    ref: { $link: string };
    size: number;
    mimeType: string;
  };
}

// API response types
interface ListRecordsResponse {
  cursor?: string;
  records: {
    uri: string;
    cid: string;
    value: BookHiveBookRecord;
  }[];
}

// Configuration - update these to fetch from different sources
const PDS_ENDPOINT = "https://eurosky.social";
const USER_DID = "did:plc:jhmdbcph6xja3hamtoi4kdy4";
const BOOKHIVE_COLLECTION = "buzz.bookhive.book";

// BookHive's PDS (for catalog books)
const BOOKHIVE_PDS = "https://bluesky.nickthesick.com";
const BOOKHIVE_DID = "did:plc:enu2j5xjlqsjaylv3du4myh4";

// Fetch all books from user's PDS, following the pagination cursor
async function fetchUserBooks(): Promise<BookHiveBookRecord[]> {
  const allBooks: BookHiveBookRecord[] = [];
  const seenCursors = new Set<string>();
  try {
    let cursor: string | undefined;

    do {
      const url = new URL(`${PDS_ENDPOINT}/xrpc/com.atproto.repo.listRecords`);
      url.searchParams.set("repo", USER_DID);
      url.searchParams.set("collection", BOOKHIVE_COLLECTION);
      url.searchParams.set("limit", "100");
      if (cursor) url.searchParams.set("cursor", cursor);

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ListRecordsResponse = await response.json();
      allBooks.push(...data.records.map((r) => r.value));

      cursor = data.cursor;
      if (!cursor || data.records.length === 0 || seenCursors.has(cursor)) break;
      seenCursors.add(cursor);
    } while (true);
  } catch (err) {
    console.error("Error fetching user books:", err);
  }
  return allBooks;
}

// Fetch catalog book details
async function fetchCatalogBook(uri: string): Promise<BookHiveCatalogBook | null> {
  try {
    // Extract DID and rkey from URI
    // URI format: at://did:plc:.../buzz.bookhive.catalogBook/rkey
    const match = uri.match(/at:\/\/(did:[^\/]+)\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;

    const [, did, collection, rkey] = match;
    const url = new URL(`${BOOKHIVE_PDS}/xrpc/com.atproto.repo.getRecord`);
    url.searchParams.set("repo", did);
    url.searchParams.set("collection", collection);
    url.searchParams.set("rkey", rkey);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.value as BookHiveCatalogBook;
  } catch (err) {
    console.error("Error fetching catalog book:", err);
    return null;
  }
}

// Convert BookHive record to display format
interface DisplayBook {
  uri: string;
  title: string;
  authors: string;
  coverUrl?: string;
  rating?: number; // Converted to 1-5 scale
  status?: string;
  description?: string;
  publishedDate?: string;
  isbn?: string;
  tags?: string[];
  review?: string;
  progress?: number; // 0-100
  currentPage?: number;
  totalPages?: number;
  createdAt?: string;
}

function convertToDisplayBook(record: BookHiveBookRecord): DisplayBook {
  // Convert stars from the 1-10 scale to a 1-5 scale, keeping half stars
  const rating = record.stars ? record.stars / 2 : undefined;

  // Extract status name (e.g., "reading" from "buzz.bookhive.defs#reading")
  const status = record.status?.split("#")[1] || undefined;

  // Build cover URL
  let coverUrl: string | undefined;
  if (record.cover?.ref?.$link) {
    const blobCid = record.cover.ref.$link;
    // bsky.app CDN format: https://cdn.bsky.app/img/feed_fullsize/plain/<did>/<cid>
    coverUrl = `https://cdn.bsky.app/img/feed_fullsize/plain/${USER_DID}/${blobCid}`;
  }

  // ISBN: prefer isbn13, then isbn10
  const isbn = record.identifiers?.isbn13 || record.identifiers?.isbn10;

  return {
    uri: `at://${USER_DID}/${BOOKHIVE_COLLECTION}/${record.hiveId}`,
    title: record.title,
    authors: record.authors,
    coverUrl,
    rating,
    status,
    description: undefined, // Would come from catalog book
    publishedDate: undefined,
    isbn,
    tags: record.tags,
    review: record.review,
    progress: record.bookProgress?.percent,
    currentPage: record.bookProgress?.currentPage,
    totalPages: record.bookProgress?.totalPages,
    createdAt: record.createdAt,
  };
}

// Group books by reading status and render full cards
function renderByStatusMarkup(books: DisplayBook[]): string {
  // Group by status
  const statusGroups: Record<string, DisplayBook[]> = {};
  books.forEach((book) => {
    const status = book.status || "other";
    if (!statusGroups[status]) statusGroups[status] = [];
    statusGroups[status].push(book);
  });

  // Status display names
  const statusLabels: Record<string, string> = {
    reading: "Reading",
    finished: "Read",
    wantToRead: "Want to Read",
    paused: "Paused",
    abandoned: "Abandoned",
    other: "Other",
  };

  // Ordered status keys
  const orderedStatuses = ["reading", "finished", "wantToRead", "paused", "abandoned", "other"];

  return orderedStatuses
    .map((statusKey) => {
      const group = statusGroups[statusKey];
      if (!group || group.length === 0) return "";

      return `
            <div class="mb-5">
              <h3 class="mb-3">${statusLabels[statusKey] || statusKey} (${group.length})</h3>
              <div class="row g-4">
                ${group.map((book) => renderBookCard(book)).join("")}
              </div>
            </div>
          `;
    })
    .join("");
}

// Render a single book as a full card (used in the "By status" view)
function renderBookCard(book: DisplayBook): string {
  return `
                   <div class="col-12 col-md-6 col-lg-4">
                     <div class="card shadow-sm">
                      ${
                        book.coverUrl
                          ? `
                        <img src="${escapeHtml(book.coverUrl)}"
                             class="card-img-top"
                             alt="${escapeHtml(book.title)}"
                             style="height: 200px; object-fit: cover;"
                             onerror="this.style.display='none'">
                      `
                          : `
                        <div class="card-img-top bg-secondary d-flex align-items-center justify-content-center" style="height: 200px;">
                          <i class="bi bi-book" style="font-size: 3rem; color: white;"></i>
                        </div>
                      `
                      }
                      <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${escapeHtml(book.title)}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${escapeHtml(book.authors)}</h6>
                        ${book.review ? `<p class="card-text flex-grow-1">${escapeHtml(truncate(book.review, 150))}</p>` : ""}
                        <div class="mt-auto">
                          ${
                            book.rating
                              ? `
                            <div class="text-warning mb-2">
                              ${renderStars(book.rating)}
                            </div>
                          `
                              : ""
                          }
                           ${
                             book.progress !== undefined
                               ? `
                             <div class="progress mb-2" style="height: 8px; background-color: #343a40; border-radius: 4px; overflow: hidden;">
                               <div role="progressbar"
                                    style="width: ${book.progress}%; height: 100%; background-color: #28a745; border-radius: 4px;"
                                    aria-valuenow="${book.progress}" aria-valuemin="0" aria-valuemax="100">
                               </div>
                             </div>
                             ${
                               book.currentPage && book.totalPages
                                 ? `<small style="display: block; color: #6c757d; margin-top: 0.5rem;">Page ${book.currentPage} of ${book.totalPages}</small>`
                                 : ""
                             }
                           `
                               : ""
                           }
                          ${
                            book.tags && book.tags.length > 0
                              ? `
                            <div class="d-flex flex-wrap gap-1 mt-2">
                              ${book.tags.map((tag) => `<span class="badge bg-light text-dark">${escapeHtml(tag)}</span>`).join("")}
                            </div>
                          `
                              : ""
                          }
                        </div>
                      </div>
                       ${book.isbn ? `<div style="padding: 0.5rem 1rem; border-top: 1px solid #495057;"><small style="color: #6c757d;">ISBN: ${escapeHtml(book.isbn)}</small></div>` : ""}
                    </div>
                  </div>
                `;
}

// Rating tiers, highest first. Empty tiers are skipped.
const RATING_TIERS = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1];

// Group books into rating tiers and render a compact cover grid
function renderByRatingMarkup(books: DisplayBook[]): string {
  const byTitle = (a: DisplayBook, b: DisplayBook) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: "base" });

  const tiers = RATING_TIERS.map((tier) => ({
    label: `<span class="text-warning">${renderStars(tier)}</span>`,
    books: books.filter((book) => book.rating === tier).sort(byTitle),
  }));

  const unrated = books.filter((book) => book.rating === undefined).sort(byTitle);
  if (unrated.length > 0) {
    tiers.push({ label: "Unrated", books: unrated });
  }

  return tiers
    .filter((tier) => tier.books.length > 0)
    .map(
      (tier) => `
            <div class="rating-tier mb-5">
              <h3 class="rating-tier-heading mb-3">${tier.label} (${tier.books.length})</h3>
              <div class="cover-grid">
                ${tier.books.map((book) => renderCoverTile(book)).join("")}
              </div>
            </div>
          `,
    )
    .join("");
}

// Render a single book as a cover tile with a title/author overlay
function renderCoverTile(book: DisplayBook): string {
  const cover = book.coverUrl
    ? `<img src="${escapeHtml(book.coverUrl)}" class="cover-tile-img" alt="${escapeHtml(book.title)}" loading="lazy" onerror="this.style.display='none'">`
    : `<div class="cover-tile-img cover-tile-placeholder"><i class="bi bi-book"></i></div>`;

  return `
    <div class="cover-tile">
      ${cover}
      <div class="cover-tile-overlay">
        <div class="cover-tile-title">${escapeHtml(book.title)}</div>
        <div class="cover-tile-author">${escapeHtml(book.authors)}</div>
      </div>
    </div>`;
}

type BooksView = "status" | "rating";

function getViewFromHash(): BooksView {
  return window.location.hash === "#rating" ? "rating" : "status";
}

// Render the books page in the currently selected view
function renderBooks(books: DisplayBook[]): void {
  const container = document.getElementById("books-app");
  if (!container) return;

  if (books.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        <p>No books found from BookHive.</p>
      </div>
    `;
    return;
  }

  const view = getViewFromHash();
  const statusActive = view === "status";

  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Books (${books.length})</h2>
    </div>
    <div class="books-view-tabs nav nav-pills mb-4" role="tablist" aria-label="Books view">
      <button type="button" class="nav-link${statusActive ? " active" : ""}" data-view="status"
              role="tab" aria-selected="${statusActive}">By status</button>
      <button type="button" class="nav-link${statusActive ? "" : " active"}" data-view="rating"
              role="tab" aria-selected="${!statusActive}">By rating</button>
    </div>
    ${view === "rating" ? renderByRatingMarkup(books) : renderByStatusMarkup(books)}
  `;
}

let currentBooks: DisplayBook[] = [];

// Switch view, syncing the URL hash so the choice is shareable
function setView(view: BooksView): void {
  const target = view === "rating" ? "#rating" : "";
  if (window.location.hash !== target) {
    window.location.hash = target;
  } else {
    renderBooks(currentBooks);
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Render a 1-5 rating, including half stars
function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = Math.max(0, 5 - full - (half ? 1 : 0));
  return (
    '<i class="bi bi-star-fill"></i>'.repeat(full) +
    (half ? '<i class="bi bi-star-half"></i>' : "") +
    '<i class="bi bi-star"></i>'.repeat(empty)
  );
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

// Status priority for sorting
const STATUS_PRIORITY: Record<string, number> = {
  reading: 1,
  finished: 2,
  wantToRead: 3,
  paused: 4,
  abandoned: 5,
};

// Initialize on page load
async function initBooksPage(): Promise<void> {
  const books = await fetchUserBooks();
  currentBooks = books.map(convertToDisplayBook);

  // Sort by status priority, then by createdAt (newest first)
  currentBooks.sort((a, b) => {
    const aPriority = STATUS_PRIORITY[a.status || ""] || 999;
    const bPriority = STATUS_PRIORITY[b.status || ""] || 999;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  renderBooks(currentBooks);
}

// Re-render when the view hash changes (tab clicks / back button / shared links)
window.addEventListener("hashchange", () => renderBooks(currentBooks));

// Delegate tab clicks on the view switcher
document.addEventListener("click", (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  const button = target?.closest?.("[data-view]") as HTMLElement | null;
  if (!button) return;
  event.preventDefault();
  setView((button.getAttribute("data-view") as BooksView) || "status");
});

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBooksPage);
} else {
  initBooksPage();
}
