// Node DOM-shim harness for the books page.
// Builds assets/js/atproto-books.ts with esbuild (same code path as Hugo's
// js.Build), runs the bundle against a stubbed DOM + fetch, and asserts on
// the rendered markup. Exits non-zero on any failed check.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";
import assert from "node:assert";

const root = path.resolve(import.meta.dirname, "..");
const bundleOut = path.join(root, "public", "js", "atproto-books.js");

execFileSync(
  path.join(root, "node_modules", ".bin", "esbuild"),
  ["assets/js/atproto-books.ts", "--bundle", "--format=iife", `--outfile=${bundleOut}`],
  { cwd: root, stdio: "inherit" },
);

const bundle = readFileSync(bundleOut, "utf8");

// All fixtures carry stars:10 (rating 5.0) so the rating view has a single tier.
const rec = (title, authors, extra) => ({
  uri: `at://did:plc:test/buzz.bookhive.book/${title.replace(/\W/g, "")}`,
  cid: "cid",
  value: {
    $type: "buzz.bookhive.book",
    title,
    authors,
    hiveId: `bk_${title.replace(/\W/g, "")}`,
    stars: 10,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  },
});

const RECORDS = [
  rec("Book A", "Greta Graeber", { owned: true, status: "buzz.bookhive.defs#finished", finishedAt: "2026-08-01T00:00:00.000Z", createdAt: "2026-01-10T00:00:00.000Z" }),
  rec("Book B", "Knut Hamsun", { status: "buzz.bookhive.defs#finished", finishedAt: "2026-06-01T00:00:00.000Z", createdAt: "2026-01-09T00:00:00.000Z" }),
  rec("Book C", "Ada Nørdlig", { status: "buzz.bookhive.defs#finished", createdAt: "2026-01-01T00:00:00.000Z" }),
  rec("Book D", "Zoe Zola", { status: "buzz.bookhive.defs#finished", createdAt: "2026-03-01T00:00:00.000Z" }),
  rec("Zorba", "Ursula K. Le Guin\tJames Baldwin", { status: "buzz.bookhive.defs#reading" }),
  rec("Alpha", "Astrid Vestli", { status: "buzz.bookhive.defs#reading" }),
  rec("Only Title", "", { status: "buzz.bookhive.defs#wantToRead" }),
];

function makeDiv() {
  const el = { _text: "" };
  Object.defineProperty(el, "textContent", {
    set(v) {
      el._text = String(v);
    },
  });
  Object.defineProperty(el, "innerHTML", { get: () => el._text });
  return el;
}

const container = { innerHTML: "" };
const documentStub = {
  readyState: "complete",
  getElementById: (id) => (id === "books-app" ? container : null),
  createElement: () => makeDiv(),
  addEventListener: () => {},
};
const listeners = {};
const windowStub = {
  location: { hash: "" },
  addEventListener: (ev, fn) => {
    listeners[ev] = fn;
  },
};
const fetchStub = async (url) => {
  if (String(url).includes("listRecords")) {
    return { ok: true, json: async () => ({ records: RECORDS }) };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

const sandbox = {
  document: documentStub,
  window: windowStub,
  fetch: fetchStub,
  URL,
  console,
  setTimeout,
  clearTimeout,
};
vm.createContext(sandbox);
vm.runInContext(bundle, sandbox);

for (let i = 0; i < 50 && !container.innerHTML.includes("Books ("); i++) {
  await new Promise((r) => setTimeout(r, 10));
}

const titlesIn = (html, sectionRe, titleRe) => {
  const m = html.match(sectionRe);
  return m ? [...m[1].matchAll(titleRe)].map((t) => t[1]) : null;
};

const checks = [];
const check = (name, fn) => {
  try {
    fn();
    checks.push([name, true, ""]);
  } catch (err) {
    checks.push([name, false, err.message.split("\n")[0]]);
  }
};

const statusHtml = container.innerHTML;

check("page renders all seven books", () => {
  for (const t of ["Book A", "Book B", "Book C", "Book D", "Zorba", "Alpha", "Only Title"]) {
    assert.ok(statusHtml.includes(t), `missing ${t}`);
  }
});
check("status grouping intact", () => {
  assert.ok(statusHtml.includes("Read (4)"));
  assert.ok(statusHtml.includes("Reading (2)"));
});
check("stars render", () => assert.ok(statusHtml.includes("bi-star-fill")));
check("exactly one .owned-pill (only the owned book)", () => {
  assert.equal((statusHtml.match(/class="owned-pill"/g) || []).length, 1);
});
check("pill contains bi-book glyph + word", () => {
  assert.match(statusHtml, /class="owned-pill"[\s\S]{0,200}?bi-book/);
  assert.match(statusHtml, /class="owned-pill"[\s\S]{0,200}>Owned</);
});
check("old <small>Owned</small> markup removed", () => {
  assert.ok(!statusHtml.includes(">Owned</small>"));
});
check("Read group: finishedAt newest first, no-finishedAt bottom (surname order)", () => {
  const order = titlesIn(
    statusHtml,
    /<h3 class="mb-3">Read \(\d+\)<\/h3>([\s\S]*?)(?=<h3 class="mb-3">|$)/,
    /card-title">([^<]*)</g,
  );
  assert.deepStrictEqual(order, ["Book A", "Book B", "Book C", "Book D"]);
});

// Switch to the rating view via the hashchange listener.
windowStub.location.hash = "#rating";
listeners.hashchange();
const ratingHtml = container.innerHTML;

check("rating tier: surname A-Z, first author wins, title fallback", () => {
  const order = [...ratingHtml.matchAll(/cover-tile-title">([^<]*)</g)].map((m) => m[1]);
  // Graeber < Guin(Le Guin, first author) < Hamsun < Nørdlig < "Only Title"(no author) < Vestli < Zola
  assert.deepStrictEqual(order, ["Book A", "Zorba", "Book B", "Book C", "Only Title", "Alpha", "Book D"]);
});

let failed = 0;
for (const [name, ok, msg] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${msg ? `\n      ${msg}` : ""}`);
  if (!ok) failed++;
}
console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
