// Node DOM-shim harness for the books page ("By status" view).
// Builds assets/js/atproto-books.ts with esbuild (same code path as Hugo's
// js.Build), runs the bundle against a stubbed DOM + fetch, and asserts on
// the rendered markup. Exits non-zero on any failed check.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const bundleOut = path.join(root, "public", "js", "atproto-books.js");

execFileSync(
  path.join(root, "node_modules", ".bin", "esbuild"),
  ["assets/js/atproto-books.ts", "--bundle", "--format=iife", `--outfile=${bundleOut}`],
  { cwd: root, stdio: "inherit" },
);

const bundle = readFileSync(bundleOut, "utf8");

const RECORDS = [
  {
    uri: "at://did:plc:test/buzz.bookhive.book/1",
    cid: "cid1",
    value: {
      $type: "buzz.bookhive.book",
      title: "Owned Book",
      authors: "A. Owner",
      hiveId: "bk_1",
      owned: true,
      stars: 8,
      status: "buzz.bookhive.defs#finished",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  },
  {
    uri: "at://did:plc:test/buzz.bookhive.book/2",
    cid: "cid2",
    value: {
      $type: "buzz.bookhive.book",
      title: "Lent Book",
      authors: "B. Borrower",
      hiveId: "bk_2",
      owned: false,
      status: "buzz.bookhive.defs#reading",
      createdAt: "2026-01-02T00:00:00.000Z",
    },
  },
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
const windowStub = { location: { hash: "" }, addEventListener: () => {} };
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

const html = container.innerHTML;
const count = (re) => (html.match(re) || []).length;

const checks = [
  ["page renders both books", html.includes("Owned Book") && html.includes("Lent Book")],
  ["status grouping intact", html.includes("Read (") && html.includes("Reading (")],
  ["stars render", html.includes("bi-star-fill")],
  ["exactly one .owned-pill (only the owned book)", count(/class="owned-pill"/g) === 1],
  ["pill contains bi-book glyph", /class="owned-pill"[\s\S]{0,200}?bi-book/.test(html)],
  ["pill contains the word Owned", /class="owned-pill"[\s\S]{0,200}>Owned</.test(html)],
  ["old <small>Owned</small> markup removed", !html.includes(">Owned</small>")],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failed++;
}
console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
