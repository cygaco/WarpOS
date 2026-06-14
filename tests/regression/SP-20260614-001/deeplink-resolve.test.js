#!/usr/bin/env node
"use strict";

// AC-A8 — every emitted deep_link.ref resolves to a real guide in _guides/registry.json
// (zero dangling links; a planted item whose deep_link points at a non-existent guide
// FAILS). PLUS β condition 2 — the guide viewer's [ref] resolver is path-traversal-safe:
// a planted `../../etc/passwd` and a registry-absent basename both yield 404 with NO disk
// read of the target.

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const REPO = process.cwd();
const {
  buildReadinessReport,
  loadGuideFiles,
  resolveDeepLink,
} = require(path.join(REPO, "scripts", "scaffold", "readiness-report.js"));

const GUIDE_PAGE = path.join(
  REPO,
  "framework",
  "templates",
  "app-scaffold",
  "src",
  "app",
  "admin",
  "guides",
  "[ref]",
  "page.tsx.tmpl",
);

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// ── Mirror of the viewer's resolveGuideRef (same algorithm as the .tsx.tmpl) ───────
// The allowlist is derived from the SAME source the producer uses (registry basenames),
// separators are stripped FIRST. Returns a safe basename or null (null → 404, no read).
function allowlistedGuideBasenames(repoRoot) {
  const set = new Set();
  for (const f of loadGuideFiles(repoRoot)) {
    set.add(String(f).replace(/\.md$/i, ""));
  }
  return set;
}
function resolveGuideRef(rawRef, repoRoot) {
  if (!rawRef) return null;
  const base = String(rawRef)
    .split(/[\\/]/)
    .pop()
    .replace(/\.md$/i, "");
  if (!base || base === "." || base === ".." || base.includes("..")) return null;
  return allowlistedGuideBasenames(repoRoot).has(base) ? base : null;
}

// ── every-emitted-link-resolves-no-dangling ───────────────────────────────────────
test("every-emitted-link-resolves-no-dangling", () => {
  const guideFiles = loadGuideFiles(REPO);
  assert.ok(guideFiles.size > 0, "registry must declare at least one guide");

  // Inject a representative checklist fixture (the producer runs in a PRODUCT repo with a
  // FOUNDERS_CHECKLIST.md; here we inject items covering id-exact, id-prefix, and dim
  // deep-link resolution paths so every emitted ref is checked against the registry).
  const checklist = {
    source: "FOUNDERS_CHECKLIST.md",
    items: [
      { id: "provider.accounts", label: "Dev accounts", dim: "product", checked: false, source: "core" },
      { id: "domain.dns", label: "DNS", dim: "deployment", checked: false, source: "core" },
      { id: "legal.privacy_terms", label: "Privacy + terms", dim: "privacy", checked: true, source: "core" },
      { id: "store.listings", label: "Store listing", dim: "funnel", checked: false, source: "core" },
      { id: "payments.stripe.identity", label: "Stripe identity", dim: "monetization", checked: false, source: "conditional" },
      { id: "production.env", label: "Prod env", dim: "deployment", checked: false, source: "core" },
    ],
  };
  const report = buildReadinessReport(REPO, {
    generated_at: "2026-06-14T00:00:00Z",
    checklist,
  });

  let guideLinks = 0;
  for (const item of report.items) {
    if (item.deep_link.kind === "guide") {
      guideLinks++;
      assert.ok(
        item.deep_link.ref && guideFiles.has(item.deep_link.ref),
        `dangling deep_link: ${item.id} -> ${item.deep_link.ref} not in registry`,
      );
    } else {
      assert.strictEqual(
        item.deep_link.ref,
        null,
        `kind:"none" must carry ref:null (item ${item.id})`,
      );
    }
  }
  assert.ok(guideLinks >= 1, "at least one item should resolve to a real guide link");
});

// ── planted-dangling-link-fails (negative control) ────────────────────────────────
test("planted-dangling-link-fails", () => {
  // A guide set that does NOT contain the file the producer would resolve for this id.
  const phantomGuideFiles = new Set(["SOMETHING_ELSE.md"]);
  const link = resolveDeepLink(
    { id: "provider.accounts", dim: "product" },
    phantomGuideFiles,
  );
  // The producer must REFUSE to emit a guide link when the target isn't in the registry.
  assert.strictEqual(
    link.kind,
    "none",
    "a deep_link pointing at a registry-absent guide must collapse to kind:none, never dangle",
  );
});

// ── deeplink-ref-strips-md-for-route (CTA href contract) ──────────────────────────
test("deeplink-ref-strips-md-for-route", () => {
  // The CTA href is /admin/guides/{ref-without-.md}; the viewer accepts that basename.
  const guideFiles = loadGuideFiles(REPO);
  const sample = [...guideFiles][0]; // e.g. DEV_SETUP_GUIDE.md
  const routeRef = sample.replace(/\.md$/i, "");
  assert.strictEqual(
    resolveGuideRef(routeRef, REPO),
    routeRef,
    "a real registry basename (no .md) must resolve through the viewer",
  );
  // It must also accept the basename WITH .md (defensive).
  assert.strictEqual(resolveGuideRef(sample, REPO), routeRef);
});

// ── path-traversal-and-absent-ref-404-no-disk-read (β condition 2) ─────────────────
test("path-traversal-and-absent-ref-404-no-disk-read", () => {
  // Instrument fs.readFileSync to detect ANY disk read of a traversal target.
  const realRead = fs.readFileSync;
  const reads = [];
  fs.readFileSync = function (p, ...rest) {
    reads.push(String(p));
    return realRead.call(fs, p, ...rest);
  };
  try {
    const malicious = [
      "../../etc/passwd",
      "..\\..\\windows\\win.ini",
      "/etc/shadow",
      "....//....//etc/passwd",
      "DEFINITELY_NOT_A_REAL_GUIDE", // registry-absent basename
      "",
      ".",
      "..",
    ];
    for (const ref of malicious) {
      const resolved = resolveGuideRef(ref, REPO);
      assert.strictEqual(
        resolved,
        null,
        `traversal/absent ref must resolve to null (404, no read): ${JSON.stringify(ref)}`,
      );
    }
    // resolveGuideRef only reads the registry (allowlist source) — it must NEVER have read
    // a traversal target like /etc/passwd or win.ini.
    const leakedRead = reads.find(
      (p) => /etc[\\/](passwd|shadow)/i.test(p) || /win\.ini/i.test(p),
    );
    assert.ok(
      !leakedRead,
      `viewer resolver must not read a traversal target; saw: ${leakedRead}`,
    );
  } finally {
    fs.readFileSync = realRead;
  }
});

// ── viewer-template-has-strip-and-allowlist-guard ─────────────────────────────────
test("viewer-template-has-strip-and-allowlist-guard", () => {
  const src = fs.readFileSync(GUIDE_PAGE, "utf8");
  // Strips path separators (mirrors producer .split(/[\\/]/).pop()).
  assert.ok(
    /split\(\/\[\\\\\/\]\/\)/.test(src),
    "viewer must strip path separators (.split(/[\\\\/]/)) before lookup",
  );
  // Validates against an allowlist derived from the registry.
  assert.ok(
    /registry\.json/.test(src) && /\.has\(base\)/.test(src),
    "viewer must validate the stripped basename against the registry allowlist",
  );
  // 404s (notFound) for non-allowlisted refs.
  assert.ok(/notFound\(\)/.test(src), "viewer must notFound() on a bad ref");
  // No dangerouslySetInnerHTML (read-only, no injection).
  assert.ok(
    !/dangerouslySetInnerHTML/.test(src),
    "viewer must not use dangerouslySetInnerHTML (escaped text render only)",
  );
});

// ── runner ────────────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
for (const t of tests) {
  try {
    t.fn();
    console.log(`  ok   ${t.name}`);
    pass++;
  } catch (err) {
    console.error(`  FAIL ${t.name}: ${err.message}`);
    fail++;
  }
}
console.log(`\ndeeplink-resolve.test.js: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
