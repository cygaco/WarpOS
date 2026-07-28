#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// memory-integrity.test.js — planted-violation + live end-to-end test for the
// READ-ONLY memory-integrity structural detector.
//
// Layers (modelled on doc-ref-integrity.test.js):
//   • PURE evaluate() PLANTED, each finding class in isolation on synthetic stores
//     (no disk) — proves each structural check fires, that a CLEAN store yields 0
//     findings, and that dangling-wikilink + index-too-long are WARNINGS not findings.
//   • Parser units (parseIndex / parseFrontmatter / extractWikilinks).
//   • LIVE end-to-end in a sealed fs.mkdtempSync dir: an explicit --dir store with a
//     planted broken index pointer → ok:false, report-only exits 0, --enforce exits 1.
//   • LIVE fail-closed: an explicit --dir that does not exist exits 2; a valid
//     empty-but-present store exits 0.
//   • LIVE against the REAL in-repo .claude/agent-memory default scope: not fatal,
//     storeCount >= 1 (no hard 0-findings assert — real memory may drift).
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const CHECK = path.join(__dirname, "memory-integrity.js");
const mod = require("./memory-integrity.js");

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

// Helper: a minimal valid file record (well-formed frontmatter).
function validFile(file, name, extra) {
  return Object.assign(
    {
      file,
      hasFrontmatter: true,
      name,
      description: "a one-line description",
      type: "feedback",
      wikilinks: [],
    },
    extra || {},
  );
}
// Helper: a store with 1 index entry per file (a clean bijection) unless overridden.
function storeOf(files, opts) {
  opts = opts || {};
  const indexEntries =
    opts.indexEntries ||
    files.map((f, i) => ({ line: i + 1, title: f.name, target: f.file, hook: "h" }));
  return {
    dir: opts.dir || "mem/agent",
    maxIndexLines: opts.maxIndexLines || 200,
    indexEntries,
    indexLineCount: opts.indexLineCount != null ? opts.indexLineCount : indexEntries.length,
    files,
  };
}

// ── PURE evaluate(): each finding class in isolation ─────────────────────────

ok("PLANTED: broken-index-pointer flags (high)", () => {
  const store = storeOf([validFile("a.md", "alpha")], {
    indexEntries: [
      { line: 1, title: "A", target: "a.md", hook: "h" },
      { line: 2, title: "Gone", target: "ghost.md", hook: "h" },
    ],
  });
  const { findings } = mod.evaluate({ stores: [store] });
  const f = findings.filter((x) => x.kind === "broken-index-pointer");
  assert.strictEqual(f.length, 1, "exactly one broken pointer");
  assert.strictEqual(f[0].severity, "high");
  assert.ok(/ghost\.md/.test(f[0].message));
});

ok("PLANTED: orphan-memory-file flags (medium)", () => {
  // Two files, index only references one → the other is an orphan.
  const store = storeOf([validFile("a.md", "alpha"), validFile("b.md", "bravo")], {
    indexEntries: [{ line: 1, title: "A", target: "a.md", hook: "h" }],
  });
  const { findings } = mod.evaluate({ stores: [store] });
  const f = findings.filter((x) => x.kind === "orphan-memory-file");
  assert.strictEqual(f.length, 1, "exactly one orphan");
  assert.strictEqual(f[0].severity, "medium");
  assert.strictEqual(f[0].file, "b.md");
});

ok("PLANTED: duplicate-index-entry flags (low)", () => {
  const store = storeOf([validFile("a.md", "alpha")], {
    indexEntries: [
      { line: 1, title: "A", target: "a.md", hook: "h" },
      { line: 2, title: "A again", target: "a.md", hook: "h" },
    ],
  });
  const { findings } = mod.evaluate({ stores: [store] });
  const f = findings.filter((x) => x.kind === "duplicate-index-entry");
  assert.strictEqual(f.length, 1, "exactly one dup-index finding");
  assert.strictEqual(f[0].severity, "low");
});

ok("PLANTED: invalid-frontmatter flags for NO frontmatter (high)", () => {
  const bad = { file: "x.md", hasFrontmatter: false, name: null, description: null, type: null, wikilinks: [] };
  const store = storeOf([bad]);
  const { findings } = mod.evaluate({ stores: [store] });
  const f = findings.filter((x) => x.kind === "invalid-frontmatter");
  assert.strictEqual(f.length, 1, "one finding for the missing block");
  assert.strictEqual(f[0].severity, "high");
  assert.ok(/no YAML frontmatter/i.test(f[0].message));
});

ok("PLANTED: invalid-frontmatter flags for EMPTY name (high, names the field)", () => {
  const bad = validFile("x.md", "", {});
  const store = storeOf([bad]);
  const f = mod.evaluate({ stores: [store] }).findings.filter((x) => x.kind === "invalid-frontmatter");
  assert.strictEqual(f.length, 1);
  assert.ok(/'name'/.test(f[0].message), "message names the name field");
});

ok("PLANTED: invalid-frontmatter flags for EMPTY description (high, names the field)", () => {
  const bad = validFile("x.md", "xray", { description: "   " });
  const store = storeOf([bad]);
  const f = mod.evaluate({ stores: [store] }).findings.filter((x) => x.kind === "invalid-frontmatter");
  assert.strictEqual(f.length, 1);
  assert.ok(/'description'/.test(f[0].message), "message names the description field");
});

ok("PLANTED: invalid-frontmatter flags for BAD/ABSENT type (high, names the field)", () => {
  const badType = validFile("x.md", "xray", { type: "nonsense" });
  const absentType = validFile("y.md", "yankee", { type: null });
  const store = storeOf([badType, absentType], {
    indexEntries: [
      { line: 1, title: "X", target: "x.md", hook: "h" },
      { line: 2, title: "Y", target: "y.md", hook: "h" },
    ],
  });
  const f = mod.evaluate({ stores: [store] }).findings.filter((x) => x.kind === "invalid-frontmatter");
  assert.strictEqual(f.length, 2, "one per bad-type file");
  assert.ok(f.every((x) => /metadata\.type/.test(x.message)), "each names metadata.type");
});

ok("PLANTED: duplicate-name-slug flags (high)", () => {
  const store = storeOf([validFile("a.md", "same-slug"), validFile("b.md", "same-slug")], {
    indexEntries: [
      { line: 1, title: "A", target: "a.md", hook: "h" },
      { line: 2, title: "B", target: "b.md", hook: "h" },
    ],
  });
  const f = mod.evaluate({ stores: [store] }).findings.filter((x) => x.kind === "duplicate-name-slug");
  assert.strictEqual(f.length, 1, "one dup-slug finding for the pair");
  assert.strictEqual(f[0].severity, "high");
  assert.ok(/same-slug/.test(f[0].message));
});

ok("CLEAN store yields 0 findings and 0 warnings (does not flag everything)", () => {
  const store = storeOf([
    validFile("a.md", "alpha", { wikilinks: ["bravo"] }),
    validFile("b.md", "bravo"),
  ]);
  const { findings, warnings } = mod.evaluate({ stores: [store] });
  assert.strictEqual(findings.length, 0, `expected 0 findings, got ${JSON.stringify(findings)}`);
  assert.strictEqual(warnings.length, 0, `expected 0 warnings, got ${JSON.stringify(warnings)}`);
});

// ── WARNINGS: never findings ─────────────────────────────────────────────────

ok("SAFETY: a dangling-wikilink is a WARNING, NOT a finding", () => {
  const store = storeOf([validFile("a.md", "alpha", { wikilinks: ["write-me-later"] })]);
  const { findings, warnings } = mod.evaluate({ stores: [store] });
  assert.strictEqual(findings.length, 0, "dangling links never block");
  const w = warnings.filter((x) => x.kind === "dangling-wikilink");
  assert.strictEqual(w.length, 1);
  assert.strictEqual(w[0].severity, "warning");
  assert.ok(/write-me-later/.test(w[0].message));
});

ok("index-too-long is a WARNING (0 findings) when indexLineCount > maxIndexLines", () => {
  const store = storeOf([validFile("a.md", "alpha")], {
    maxIndexLines: 1,
    indexLineCount: 5,
    indexEntries: [{ line: 1, title: "A", target: "a.md", hook: "h" }],
  });
  const { findings, warnings } = mod.evaluate({ stores: [store] });
  assert.strictEqual(findings.length, 0, "too-long never blocks");
  const w = warnings.filter((x) => x.kind === "index-too-long");
  assert.strictEqual(w.length, 1);
  assert.strictEqual(w[0].severity, "warning");
});

// ── Parser units ─────────────────────────────────────────────────────────────

ok("parseIndex extracts target + counts non-blank lines", () => {
  const text = "- [Title A](file_a.md) — hook a\n\n- [Title B](file_b.md) — hook b\nnotanentry\n";
  const { entries, lineCount } = mod.parseIndex(text);
  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].target, "file_a.md");
  assert.strictEqual(entries[0].title, "Title A");
  assert.strictEqual(lineCount, 3, "3 non-blank lines (2 entries + 1 stray)");
});

ok("parseFrontmatter reads name/description/metadata.type + strips the block from body", () => {
  const text =
    "---\nname: my-slug\ndescription: one line\nmetadata:\n  type: feedback\n---\n\nBody with [[a-link]].\n";
  const fm = mod.parseFrontmatter(text);
  assert.strictEqual(fm.hasFrontmatter, true);
  assert.strictEqual(fm.name, "my-slug");
  assert.strictEqual(fm.description, "one line");
  assert.strictEqual(fm.type, "feedback");
  assert.ok(/Body with/.test(fm.body));
  assert.ok(!/name: my-slug/.test(fm.body), "frontmatter stripped from body");
});

ok("parseFrontmatter reports hasFrontmatter:false when the block is absent", () => {
  const fm = mod.parseFrontmatter("no frontmatter here\njust text\n");
  assert.strictEqual(fm.hasFrontmatter, false);
});

ok("extractWikilinks pulls [[slugs]] and ignores the two identifier spaces", () => {
  const links = mod.extractWikilinks("see [[first-slug]] and [[second-slug]] not [a](file.md)");
  assert.deepStrictEqual(links, ["first-slug", "second-slug"]);
});

// ── LIVE end-to-end: sealed temp store, planted broken index pointer ──────────

function seedStore(dir, opts) {
  opts = opts || {};
  fs.mkdirSync(dir, { recursive: true });
  const valid =
    "---\nname: valid-one\ndescription: a real memory\nmetadata:\n  type: feedback\n---\n\nBody.\n";
  fs.writeFileSync(path.join(dir, "valid_one.md"), valid);
  const index =
    "- [Valid One](valid_one.md) — a real memory\n" +
    (opts.broken ? "- [Broken](missing_file.md) — points at nothing\n" : "");
  fs.writeFileSync(path.join(dir, "MEMORY.md"), index);
}

ok("LIVE-PLANTED: a broken index pointer in a sealed --dir store is caught end-to-end", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memint-"));
  const store = path.join(base, "agent");
  seedStore(store, { broken: true });

  const r = spawnSync("node", [CHECK, "--dir", store, "--json"], { encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.ok, false, "should report the broken pointer");
  assert.strictEqual(out.skipped, false);
  assert.ok(
    out.findings.some((f) => f.kind === "broken-index-pointer" && /missing_file\.md/.test(f.message)),
    "the broken pointer is a finding",
  );
  assert.ok(
    !out.findings.some((f) => f.message && /valid_one\.md/.test(f.message)),
    "the valid entry is not flagged",
  );
  assert.strictEqual(r.status, 0, "report-only exits 0 even with a finding");

  const r2 = spawnSync("node", [CHECK, "--dir", store, "--enforce"], { encoding: "utf8" });
  assert.strictEqual(r2.status, 1, "--enforce blocks on a finding");
});

ok("LIVE: a CLEAN sealed --dir store passes (exit 0, ok:true)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memint-"));
  const store = path.join(base, "agent");
  seedStore(store, { broken: false });
  const r = spawnSync("node", [CHECK, "--dir", store, "--json"], { encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.ok, true, `clean store ok, got ${JSON.stringify(out.findings)}`);
  assert.strictEqual(out.storeCount, 1);
  assert.strictEqual(r.status, 0);
});

// ── LIVE fail-closed: explicit --dir that is not a valid store ────────────────

ok("LIVE: an explicit --dir that does not exist FAILS CLOSED (exit 2)", () => {
  const nonexistent = path.join(os.tmpdir(), "memint-does-not-exist-" + Date.now());
  const r = spawnSync("node", [CHECK, "--dir", nonexistent, "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "bad explicit --dir is fail-closed exit 2");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
});

ok("LIVE: an explicit --dir that exists but has no MEMORY.md FAILS CLOSED (exit 2)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memint-"));
  const store = path.join(base, "notastore");
  fs.mkdirSync(store, { recursive: true });
  fs.writeFileSync(path.join(store, "some.md"), "no index here\n");
  const r = spawnSync("node", [CHECK, "--dir", store, "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a dir without MEMORY.md is not a valid store");
});

// ── LIVE skip-on-absent: default scope with no .claude/agent-memory ───────────

ok("LIVE-SKIP: default scope with no .claude/agent-memory SKIPS (skipped:true, exit 0)", () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "memint-proj-"));
  // No .claude/agent-memory under this CLAUDE_PROJECT_DIR.
  const r = spawnSync("node", [CHECK, "--json"], {
    env: { ...process.env, CLAUDE_PROJECT_DIR: proj },
    encoding: "utf8",
  });
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.skipped, true, "skip-on-absent, not fail-closed");
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.storeCount, 0);
  assert.strictEqual(r.status, 0, "skip exits 0");
});

// ── LIVE default scope against a POPULATED store tree (storeCount>=1) ─────────
// NOTE: the real in-repo `.claude/agent-memory/` is GITIGNORED (a local, per-machine
// store), so it is legitimately absent in a fresh worktree/CI checkout. To exercise a
// realistic default-scope scan deterministically we seed a populated store tree under a
// temp CLAUDE_PROJECT_DIR and assert storeCount>=1 + not fatal (do NOT hard-assert 0
// findings — a real store may drift).
ok("LIVE: default scope over a populated .claude/agent-memory is not fatal, storeCount>=1", () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "memint-proj-"));
  const agentDir = path.join(proj, ".claude", "agent-memory", "epsilon");
  seedStore(agentDir, { broken: false });
  const r = spawnSync("node", [CHECK, "--json"], {
    env: { ...process.env, CLAUDE_PROJECT_DIR: proj },
    encoding: "utf8",
  });
  const out = JSON.parse(r.stdout);
  assert.notStrictEqual(out.fatal, true, "default scope over a real store must not be fatal");
  assert.strictEqual(out.skipped, false, "a populated store is scanned, not skipped");
  assert.ok(out.storeCount >= 1, `expected >=1 store, got ${out.storeCount}`);
  assert.strictEqual(r.status, 0, "report-only exits 0");
});

// ── LIVE against the REAL in-repo default scope (skip-or-scan, both valid) ────
ok("LIVE: real in-repo default scope run() is never fatal (skip-on-absent OR scans)", () => {
  const res = mod.run({});
  assert.notStrictEqual(res.fatal, true, "must not be fatal against the real repo");
  // The store is gitignored, so either it is present (scanned, storeCount>=1) or absent
  // in this checkout (skipped). Both are valid; neither is fatal.
  if (res.skipped) {
    assert.strictEqual(res.storeCount, 0);
  } else {
    assert.ok(res.storeCount >= 1, `scanned → expected >=1 store, got ${res.storeCount}`);
  }
});

// ── ReDoS regression (security gauntlet r1): extractWikilinks must be O(n) ─────
ok("ReDoS: extractWikilinks on a long unclosed-'[[' body is O(n) + still extracts real slugs", () => {
  const adversarial = "[".repeat(100000); // quadratic on the old /[^\]]+/ regex (~21s), O(n) now
  const t0 = Date.now();
  const got = mod.extractWikilinks(adversarial);
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 1000, `extractWikilinks took ${elapsed}ms on 100k '[' — must be < 1s (O(n))`);
  assert.deepStrictEqual(got, [], "no closed [[slug]] → no matches");
  assert.deepStrictEqual(
    mod.extractWikilinks("see [[a-slug]] and [[b-slug]] here"),
    ["a-slug", "b-slug"],
    "real slugs still extracted after the fix",
  );
  assert.deepStrictEqual(mod.extractWikilinks("[[[[x]]"), ["x"], "adjacent openers do not swallow the closer");
});

// ── fail-closed regression (security gauntlet r1): non-ENOENT MEMORY.md error ──
ok("fail-closed: default scope with an unreadable MEMORY.md (dir, not file) exits 2 — not a silent skip", () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "mi-corrupt-"));
  const badStore = path.join(proj, ".claude", "agent-memory", "badstore");
  fs.mkdirSync(badStore, { recursive: true });
  fs.mkdirSync(path.join(badStore, "MEMORY.md")); // MEMORY.md is a DIRECTORY → readFileSync throws (non-ENOENT)
  const r = spawnSync("node", [CHECK, "--json"], {
    env: { ...process.env, CLAUDE_PROJECT_DIR: proj },
    encoding: "utf8",
  });
  assert.strictEqual(r.status, 2, "a non-ENOENT store error in default scope must fail-closed (exit 2)");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true, "the run is fatal, not a silent skip");
});

// ── gauntlet r2 regressions ───────────────────────────────────────────────────

// FIX-1: a non-ENOENT error at the DEFAULT-scope memory ROOT must PROPAGATE
// (main() → exit 2, fail-closed), NOT be swallowed as a skip that exits 0 OPEN.
// (Windows returns ENOENT for a file-parented stat, so a filesystem fixture can't
// force EACCES/EISDIR portably — we monkeypatch the shared fs module object, which
// the enforcer calls through, to inject each error class deterministically.)
ok("FIX-1: a non-ENOENT error at the memory ROOT stat propagates (fail-closed), not skip", () => {
  const realStat = fs.statSync;
  try {
    fs.statSync = () => {
      const e = new Error("permission denied");
      e.code = "EACCES";
      throw e;
    };
    assert.throws(
      () => mod.run({}),
      /EACCES|permission/,
      "a non-ENOENT root stat error must propagate (→ main fail-closes exit 2), not silent-skip",
    );
  } finally {
    fs.statSync = realStat;
  }
  // Sanity: a genuinely-absent root (ENOENT) still SKIPS gracefully (does not throw).
  try {
    fs.statSync = () => {
      const e = new Error("no such file");
      e.code = "ENOENT";
      throw e;
    };
    const res = mod.run({});
    assert.strictEqual(res.skipped, true, "ENOENT at the root still skips (ok:true), not fatal");
  } finally {
    fs.statSync = realStat;
  }
});

// FIX-2: a balanced-paren filename is captured WHOLE (not truncated at the first ')').
ok("FIX-2: parseIndex captures a balanced-paren target whole (ghost(1).md)", () => {
  const { entries } = mod.parseIndex("- [T](ghost(1).md) — hook\n");
  assert.strictEqual(entries.length, 1, "the line is NOT silently omitted");
  assert.strictEqual(entries[0].target, "ghost(1).md", "target captured whole, not 'ghost(1'");
  assert.strictEqual(entries[0].hook, "hook");
});

// FIX-2 (defense-in-depth): a line that STARTS like an entry but does not parse is
// surfaced as a malformed-index-line finding, not silently dropped.
ok("FIX-2: an index-shaped-but-unparseable line → malformed-index-line (medium finding)", () => {
  const { entries, malformed } = mod.parseIndex("- [Broken](no-close-paren.md — hook\n");
  assert.strictEqual(entries.length, 0, "it did not parse as an entry");
  assert.strictEqual(malformed.length, 1, "but it was recorded as malformed, not dropped");
  const store = storeOf([validFile("a.md", "alpha")], {
    indexEntries: [{ line: 1, title: "A", target: "a.md", hook: "h" }],
  });
  store.indexMalformed = malformed;
  const f = mod.evaluate({ stores: [store] }).findings.filter((x) => x.kind === "malformed-index-line");
  assert.strictEqual(f.length, 1, "one malformed-index-line finding");
  assert.strictEqual(f[0].severity, "medium");
});

// FIX-3: decoded scalars — quotes stripped, null/~/quoted-empty absent, compound rejected.
ok("FIX-3: decodeScalar strips matched quotes; null/~/empty→absent; compound→absent", () => {
  assert.strictEqual(mod.decodeScalar('"feedback"'), "feedback", "quotes stripped");
  assert.strictEqual(mod.decodeScalar("'project'"), "project");
  assert.strictEqual(mod.decodeScalar("null"), null, "unquoted null → absent");
  assert.strictEqual(mod.decodeScalar("~"), null, "unquoted ~ → absent");
  assert.strictEqual(mod.decodeScalar('""'), null, "quoted-empty → absent");
  assert.strictEqual(mod.decodeScalar(""), null, "empty → absent");
  assert.strictEqual(mod.decodeScalar("[a, b]"), null, "flow-seq is not a simple scalar");
  assert.strictEqual(mod.decodeScalar("| block"), null, "block scalar indicator → absent");
  assert.strictEqual(mod.decodeScalar("plain-slug"), "plain-slug");
});

ok("FIX-3: quoted type passes; empty name / null description fire invalid-frontmatter", () => {
  const good = mod.parseFrontmatter(
    '---\nname: my-slug\ndescription: one\nmetadata:\n  type: "feedback"\n---\nbody\n',
  );
  assert.strictEqual(good.type, "feedback", "quoted type is decoded → valid");
  const bad = mod.parseFrontmatter(
    '---\nname: ""\ndescription: null\nmetadata:\n  type: feedback\n---\nbody\n',
  );
  assert.strictEqual(bad.name, null, "quoted-empty name → absent (was fail-open)");
  assert.strictEqual(bad.description, null, "unquoted null description → absent (was fail-open)");
  const store = storeOf([
    { file: "x.md", hasFrontmatter: true, name: bad.name, description: bad.description, type: bad.type, wikilinks: [] },
  ]);
  const f = mod.evaluate({ stores: [store] }).findings.filter((x) => x.kind === "invalid-frontmatter");
  assert.strictEqual(f.length, 2, "invalid-frontmatter fires for name AND description");
});

ok("FIX-3: quoting cannot evade duplicate-name-slug (decoded before comparison)", () => {
  const a = mod.parseFrontmatter('---\nname: "dup"\ndescription: d\nmetadata:\n  type: feedback\n---\n');
  const b = mod.parseFrontmatter("---\nname: dup\ndescription: d\nmetadata:\n  type: feedback\n---\n");
  const store = storeOf(
    [
      { file: "a.md", hasFrontmatter: true, name: a.name, description: a.description, type: a.type, wikilinks: [] },
      { file: "b.md", hasFrontmatter: true, name: b.name, description: b.description, type: b.type, wikilinks: [] },
    ],
    { indexEntries: [{ line: 1, title: "A", target: "a.md", hook: "h" }, { line: 2, title: "B", target: "b.md", hook: "h" }] },
  );
  const f = mod.evaluate({ stores: [store] }).findings.filter((x) => x.kind === "duplicate-name-slug");
  assert.strictEqual(f.length, 1, "'dup' and \"dup\" collide once decoded");
});

// FIX-6: a non-kebab name is a WARNING, never a finding.
ok("FIX-6: a non-kebab name is a WARNING (never a finding)", () => {
  const store = storeOf([validFile("a.md", "Not_Kebab_Name")]);
  const { findings, warnings } = mod.evaluate({ stores: [store] });
  assert.strictEqual(findings.filter((x) => x.kind === "non-kebab-name").length, 0, "never a finding");
  const w = warnings.filter((x) => x.kind === "non-kebab-name");
  assert.strictEqual(w.length, 1, "one non-kebab warning");
  assert.strictEqual(w[0].severity, "warning");
  assert.ok(/Not_Kebab_Name/.test(w[0].message));
});

// FIX-7: canonical empty frontmatter `---\n---` is hasFrontmatter:true, all fields null.
ok("FIX-7: canonical empty frontmatter is hasFrontmatter:true with null fields (per-field diagnostics)", () => {
  const fm = mod.parseFrontmatter("---\n---\nbody text\n");
  assert.strictEqual(fm.hasFrontmatter, true, "empty block is frontmatter, not no-frontmatter");
  assert.strictEqual(fm.name, null);
  assert.strictEqual(fm.description, null);
  assert.strictEqual(fm.type, null);
  assert.ok(/body text/.test(fm.body), "body after the empty block is preserved");
  const store = storeOf([
    { file: "x.md", hasFrontmatter: true, name: null, description: null, type: null, wikilinks: [] },
  ]);
  const f = mod.evaluate({ stores: [store] }).findings.filter((x) => x.kind === "invalid-frontmatter");
  assert.strictEqual(f.length, 3, "one missing-field finding per field, not a single no-block finding");
  assert.ok(!f.some((x) => /no YAML frontmatter/i.test(x.message)), "not the no-block message");
});

// ── FIX-130 regression: metadata.type counts ONLY as a DIRECT child ──────────
ok("parseFrontmatter: a nested `type` (metadata.other.type) does NOT satisfy metadata.type", () => {
  const nested = mod.parseFrontmatter(
    "---\nname: x-slug\ndescription: d\nmetadata:\n  other:\n    type: feedback\n---\nbody\n",
  );
  assert.strictEqual(nested.type, null, "a grandchild `type` must NOT be read as metadata.type (false green)");
  assert.strictEqual(nested.name, "x-slug", "the top-level name is still read");
  const direct = mod.parseFrontmatter(
    "---\nname: x-slug\ndescription: d\nmetadata:\n  type: feedback\n---\nbody\n",
  );
  assert.strictEqual(direct.type, "feedback", "a DIRECT child `type` IS read");
  const shadow = mod.parseFrontmatter("---\nname: real\nother:\n  name: nested\n---\nbody\n");
  assert.strictEqual(shadow.name, "real", "a nested `name` must not shadow the top-level name");
});

// ── gauntlet r8 (qa :539): default-scope root exists-but-is-a-FILE → fail-closed ──
ok("LIVE: default-scope root that EXISTS but is a FILE is fatal (exit 2), not a skip-open", () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), "mi-rootfile-"));
  fs.mkdirSync(path.join(proj, ".claude"), { recursive: true });
  fs.writeFileSync(path.join(proj, ".claude", "agent-memory"), "not a dir\n"); // the root is a FILE
  const r = spawnSync("node", [CHECK, "--enforce", "--json"], {
    env: { ...process.env, CLAUDE_PROJECT_DIR: proj },
    encoding: "utf8",
  });
  assert.strictEqual(r.status, 2, "a non-directory root is fatal, not a skip-open under --enforce");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true, "the run is fatal");
});

// ── gauntlet r9 (backend): parser hardening (decodeScalar, metadata-sequence, index regex) ──
ok("parseFrontmatter: decodeScalar handles quoted / Null-casefold / unquoted inline-comment", () => {
  const a = mod.parseFrontmatter('---\nname: x-slug\ndescription: "a desc"\nmetadata:\n  type: "feedback"\n---\nb\n');
  assert.strictEqual(a.type, "feedback", "quoted type decodes to the literal");
  assert.strictEqual(a.description, "a desc", "quoted description decodes");
  const b = mod.parseFrontmatter("---\nname: x-slug\ndescription: NULL\nmetadata:\n  type: feedback\n---\nb\n");
  assert.strictEqual(b.description, null, "unquoted NULL (any case) → absent");
  const c = mod.parseFrontmatter("---\nname: x-slug\ndescription: d\nmetadata:\n  type: feedback # inline note\n---\nb\n");
  assert.strictEqual(c.type, "feedback", "unquoted inline comment stripped");
});

ok("parseFrontmatter: metadata as a SEQUENCE or nested mapping does NOT yield metadata.type (r9 :196)", () => {
  const seq = mod.parseFrontmatter("---\nname: x\ndescription: d\nmetadata:\n  - type: feedback\n---\nb\n");
  assert.strictEqual(seq.type, null, "a sequence item under metadata is not a direct type");
  const nested = mod.parseFrontmatter("---\nname: x\ndescription: d\nmetadata:\n  wrap:\n    type: feedback\n---\nb\n");
  assert.strictEqual(nested.type, null, "a nested type under a sub-mapping is not metadata.type");
  const flat = mod.parseFrontmatter("---\nname: x\ndescription: d\nmetadata:\n  type: feedback\n---\nb\n");
  assert.strictEqual(flat.type, "feedback", "a flat direct type IS read");
});

ok("parseIndex: a filename with a hyphen after inner parens (ghost(1)-copy.md) parses WHOLE (r9 :82)", () => {
  const { entries } = mod.parseIndex("- [Ghost](ghost(1)-copy.md) — a hook\n- [Plain](plain.md)\n");
  const g = entries.find((e) => /ghost/.test(e.target));
  assert.ok(g, "the ghost line parsed as an entry");
  assert.strictEqual(g.target, "ghost(1)-copy.md", "target captured whole, not truncated at the inner ) or the -copy hyphen");
  assert.strictEqual(g.hook, "a hook", "the real hook is captured");
});

ok("ReDoS: decodeScalar (via parseFrontmatter) is O(n) on a long internal-whitespace scalar (r7)", () => {
  // A scalar with a huge internal whitespace run and no '#' was O(n^2) under /\s+#.*$/.
  const big = "a" + " ".repeat(200000) + "b";
  const t0 = Date.now();
  const fm = mod.parseFrontmatter(`---\nname: x-slug\ndescription: ${big}\nmetadata:\n  type: feedback\n---\nbody\n`);
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 1000, `parseFrontmatter took ${elapsed}ms on a 200k-space scalar — must be < 1s (O(n))`);
  assert.ok(fm.description && fm.description.startsWith("a"), "the value is still parsed");
  // a real inline comment is still stripped
  const c = mod.parseFrontmatter("---\nname: x-slug\ndescription: keep # drop this\nmetadata:\n  type: feedback\n---\nb\n");
  assert.strictEqual(c.description, "keep", "inline comment stripped with the single-\\s form");
});

// ── gauntlet r10: comment-only scalars + metadata-with-a-same-line-scalar ─────────
// PLANTED RED (:149). Before the fix the `\s#` strip required a PRECEDING whitespace, so in
// `name: # comment` the '#' sat at index 0 and was never stripped — the literal '# comment'
// came back as a valid name and invalid-frontmatter never fired for the absent field.
ok("r10 PLANTED: a comment-only value (`name: # comment`) decodes to ABSENT, not to '# comment'", () => {
  assert.strictEqual(mod.decodeScalar("# comment"), null, "leading '#' is a whole-line comment → absent");
  assert.strictEqual(mod.decodeScalar("#nospace"), null, "no space after '#' is still a comment");
  assert.strictEqual(mod.decodeScalar("   # padded   "), null, "leading whitespace then '#' → absent");
  const fm = mod.parseFrontmatter("---\nname: # comment\ndescription: # comment\nmetadata:\n  type: feedback\n---\nbody\n");
  assert.strictEqual(fm.name, null, "comment-only name is absent");
  assert.strictEqual(fm.description, null, "comment-only description is absent");
});

ok("r10 PLANTED: comment-only name/description FIRE invalid-frontmatter end-to-end", () => {
  const fm = mod.parseFrontmatter("---\nname: # comment\ndescription: # comment\nmetadata:\n  type: feedback\n---\nbody\n");
  const store = storeOf([
    { file: "x.md", hasFrontmatter: fm.hasFrontmatter, name: fm.name, description: fm.description, type: fm.type, wikilinks: [] },
  ]);
  const { findings } = mod.evaluate({ stores: [store] });
  const inv = findings.filter((f) => f.kind === "invalid-frontmatter");
  assert.strictEqual(inv.length, 2, `expected a finding for name AND description, got ${JSON.stringify(inv.map((f) => f.message))}`);
  assert.ok(inv.some((f) => /'name'/.test(f.message)), "the missing name is named");
  assert.ok(inv.some((f) => /'description'/.test(f.message)), "the missing description is named");
});

ok("r10 NO-FALSE-POSITIVE: a QUOTED '# not a comment' stays a real value", () => {
  assert.strictEqual(mod.decodeScalar('"# not a comment"'), "# not a comment", "quoted content is a literal");
  assert.strictEqual(mod.decodeScalar("'# also literal'"), "# also literal", "single quotes too");
  const fm = mod.parseFrontmatter('---\nname: "# not a comment"\ndescription: "# nor this"\nmetadata:\n  type: feedback\n---\nb\n');
  assert.strictEqual(fm.name, "# not a comment", "quoted name survives");
  assert.strictEqual(fm.description, "# nor this", "quoted description survives");
  const store = storeOf([
    { file: "x.md", hasFrontmatter: true, name: fm.name, description: fm.description, type: fm.type, wikilinks: [] },
  ]);
  const { findings } = mod.evaluate({ stores: [store] });
  assert.strictEqual(findings.filter((f) => f.kind === "invalid-frontmatter").length, 0, "no false invalid-frontmatter");
});

ok("r10 ReDoS GUARD: the leading-'#' check is O(n) — a long comment-only scalar does not backtrack", () => {
  // The leading-'#' case must be closed with an O(1) index test, NEVER by relaxing `\s#` to
  // `\s*#` — that form backtracks O(n^2) on these inputs (the r7/r9 regression this fix must not
  // reintroduce). Both a long comment-only value and a long whitespace run must stay linear.
  const bigComment = "# " + "x ".repeat(200000);
  const bigSpaces = "a" + " ".repeat(200000) + "#b";
  const t0 = Date.now();
  assert.strictEqual(mod.decodeScalar(bigComment), null, "a 400k-char comment-only value is absent");
  assert.strictEqual(mod.decodeScalar(bigSpaces), "a", "a 200k-space run before a '#' still strips");
  const elapsed = Date.now() - t0;
  assert.ok(elapsed < 1000, `decodeScalar took ${elapsed}ms on 200k-char scalars — must be < 1s (O(n))`);
});

// PLANTED RED (:229). Before the fix `if (key === "metadata")` never inspected the value, so
// `metadata: scalar` still opened a mapping parent and a later indented `type:` populated it.
ok("r10 PLANTED: `metadata: scalar` does NOT open a mapping — an indented type is UNTRUSTED", () => {
  const scalar = mod.parseFrontmatter("---\nname: x-slug\ndescription: d\nmetadata: some-scalar\n  type: feedback\n---\nb\n");
  assert.strictEqual(scalar.type, null, "a metadata carrying a same-line scalar yields no trustworthy type");
  const nullish = mod.parseFrontmatter("---\nname: x-slug\ndescription: d\nmetadata: null\n  type: feedback\n---\nb\n");
  assert.strictEqual(nullish.type, null, "`metadata: null` is a same-line value, not an empty mapping parent");
  const flow = mod.parseFrontmatter("---\nname: x-slug\ndescription: d\nmetadata: []\n  type: feedback\n---\nb\n");
  assert.strictEqual(flow.type, null, "a flow collection is not a flat mapping either");
});

ok("r10 PLANTED: `metadata: scalar` + indented type FIRES invalid-frontmatter end-to-end", () => {
  const fm = mod.parseFrontmatter("---\nname: x-slug\ndescription: d\nmetadata: some-scalar\n  type: feedback\n---\nb\n");
  const store = storeOf([
    { file: "x.md", hasFrontmatter: fm.hasFrontmatter, name: fm.name, description: fm.description, type: fm.type, wikilinks: [] },
  ]);
  const { findings } = mod.evaluate({ stores: [store] });
  const inv = findings.filter((f) => f.kind === "invalid-frontmatter");
  assert.strictEqual(inv.length, 1, "exactly the metadata.type finding");
  assert.ok(/metadata\.type/.test(inv[0].message), inv[0].message);
});

ok("r10 NO-REGRESSION: a bare `metadata:` (empty, or comment-only) still opens the mapping", () => {
  const bare = mod.parseFrontmatter("---\nname: x-slug\ndescription: d\nmetadata:\n  type: feedback\n---\nb\n");
  assert.strictEqual(bare.type, "feedback", "the canonical shape still reads metadata.type");
  const padded = mod.parseFrontmatter("---\nname: x-slug\ndescription: d\nmetadata:   \n  type: feedback\n---\nb\n");
  assert.strictEqual(padded.type, "feedback", "trailing whitespace after `metadata:` is still empty");
  const commented = mod.parseFrontmatter("---\nname: x-slug\ndescription: d\nmetadata: # note\n  type: feedback\n---\nb\n");
  assert.strictEqual(commented.type, "feedback", "a comment carries no value → still a mapping parent (composes with :149)");
  // and the clean record produces no findings
  const store = storeOf([
    { file: "x.md", hasFrontmatter: true, name: bare.name, description: bare.description, type: bare.type, wikilinks: [] },
  ]);
  assert.strictEqual(mod.evaluate({ stores: [store] }).findings.length, 0, "a canonical record stays clean");
});

ok("r10: isEmptyFieldValue distinguishes an ABSENT same-line value from a null/flow one", () => {
  assert.strictEqual(mod.isEmptyFieldValue(""), true);
  assert.strictEqual(mod.isEmptyFieldValue("   "), true);
  assert.strictEqual(mod.isEmptyFieldValue("# note"), true, "a comment carries no value");
  assert.strictEqual(mod.isEmptyFieldValue("null"), false, "`null` IS a same-line value (decodeScalar would say null — that is the difference)");
  assert.strictEqual(mod.isEmptyFieldValue("[]"), false);
  assert.strictEqual(mod.isEmptyFieldValue("scalar"), false);
});

// ── gauntlet r11 HIGH-2: the parser fails CLOSED on ambiguous frontmatter ─────
// Both shapes below used to yield `type: feedback` — a TRUSTED type off a block that is not a
// well-formed flat mapping — so validateNewBody() returned no reasons and memory-apply certified
// a structurally invalid body clean. RED against 16bcf623.

ok("r11 HIGH-2: a DUPLICATE top-level `metadata:` block yields NO trustworthy type", () => {
  const fm = mod.parseFrontmatter(
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\nmetadata:\n  type: feedback\n---\nbody\n",
  );
  assert.strictEqual(fm.type, null, "two metadata blocks cannot resolve to one trusted type");
  const problems = mod.frontmatterProblems(fm);
  assert.ok(problems.some((p) => p.field === "metadata.type"), JSON.stringify(problems));
  // and it surfaces as a real finding through evaluate()
  const store = storeOf([
    { file: "x.md", hasFrontmatter: true, name: fm.name, description: fm.description, type: fm.type, wikilinks: [] },
  ]);
  const inv = mod.evaluate({ stores: [store] }).findings.filter((f) => f.kind === "invalid-frontmatter");
  assert.strictEqual(inv.length, 1, "the store reports invalid frontmatter");
  assert.ok(/metadata\.type/.test(inv[0].message), inv[0].message);
});

ok("r11 HIGH-2: a NON-SCALAR metadata child (`tags: []`) invalidates the whole block", () => {
  const fm = mod.parseFrontmatter(
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\n  tags: []\n---\nbody\n",
  );
  assert.strictEqual(fm.type, null, "a flow-sequence child means metadata is not a flat scalar mapping");
  assert.ok(mod.frontmatterProblems(fm).some((p) => p.field === "metadata.type"));
  // every flow/block indicator, not just '['
  for (const child of ["tags: []", "tags: {}", "note: |", "note: >"]) {
    const f2 = mod.parseFrontmatter(
      `---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\n  ${child}\n---\nbody\n`,
    );
    assert.strictEqual(f2.type, null, `child '${child}' must invalidate the block`);
  }
});

ok("r11 HIGH-2: a REPEATED `type:` inside metadata is ambiguous → no trusted type", () => {
  const fm = mod.parseFrontmatter(
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\n  type: user\n---\nbody\n",
  );
  assert.strictEqual(fm.type, null, "two type: children cannot resolve to one value");
});

ok("r11 HIGH-2: a DUPLICATE top-level `name:` / `description:` is ambiguous → treated as ABSENT", () => {
  const dupName = mod.parseFrontmatter(
    "---\nname: a-slug\nname: b-slug\ndescription: d\nmetadata:\n  type: feedback\n---\nbody\n",
  );
  assert.strictEqual(dupName.name, null, "last-wins would silently pick a slug the author never declared");
  assert.ok(mod.frontmatterProblems(dupName).some((p) => p.field === "name"));
  const dupDesc = mod.parseFrontmatter(
    "---\nname: a-slug\ndescription: d1\ndescription: d2\nmetadata:\n  type: feedback\n---\nbody\n",
  );
  assert.strictEqual(dupDesc.description, null);
});

ok("r11 HIGH-2 NO-REGRESSION: ordinary SCALAR metadata siblings still leave type trustworthy", () => {
  const fm = mod.parseFrontmatter(
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\n  source: a-doc\n  count: 3\n---\nbody\n",
  );
  assert.strictEqual(fm.type, "feedback", "extra SCALAR children are fine — only non-scalars invalidate");
  assert.deepStrictEqual(mod.frontmatterProblems(fm), [], "a valid record has no problems");
});

ok("r11 HIGH-2: frontmatterProblems is the ONE validator — it accepts a canonical record and names each defect", () => {
  assert.deepStrictEqual(
    mod.frontmatterProblems({ hasFrontmatter: true, name: "a-slug", description: "d", type: "feedback" }),
    [],
  );
  assert.deepStrictEqual(
    mod.frontmatterProblems({ hasFrontmatter: false }).map((p) => p.field),
    ["block"],
    "no block short-circuits — the field diagnostics would be noise",
  );
  assert.deepStrictEqual(
    mod.frontmatterProblems({ hasFrontmatter: true, name: "", description: "  ", type: "nope" }).map((p) => p.field),
    ["name", "description", "metadata.type"],
  );
});

// ── gauntlet r10 (defect 4) / r11 LOW: header taxonomy ≡ what the code emits ──
// r11 LOW: the reverse direction used a HARDCODED `advertised` array, so it only ever proved that
// nine remembered names were emitted — a tenth kind invented in the header (`imaginary-kind`) was
// invisible to it. The advertised set is now PARSED FROM THE HEADER and compared for SET EQUALITY,
// and the parse+compare is a function so a PLANTED header can prove the test actually bites.

// Parse the kinds the header ADVERTISES out of the bounded FINDINGS/WARNINGS taxonomy block.
// Bounded on both ends so surrounding prose can never be mistaken for a kind: it starts at
// `FINDINGS (block under --enforce)` and stops at `Exit codes:`. Parenthetical annotations
// (`(high)`, `(medium)`) are stripped, the remainder is split on the `·` separator, and only
// tokens that are ENTIRELY kind-shaped (`a-b`, `a-b-c`) survive — prose clauses contain spaces
// and are dropped.
function advertisedKinds(src) {
  const start = src.indexOf("FINDINGS (block under --enforce)");
  const end = src.indexOf("Exit codes:");
  assert.ok(start > -1 && end > start, "the header taxonomy block must be locatable");
  const block = src.slice(start, end);
  const kinds = new Set();
  for (const rawLine of block.split("\n")) {
    const line = rawLine
      .replace(/^\s*\*?\s?/, "") // strip the jsdoc comment gutter
      .replace(/\([^()]*\)/g, ""); // strip `(high)` / `(medium, …)` annotations
    for (const tok of line.split("·")) {
      const t = tok.trim();
      if (/^[a-z]+(-[a-z]+)+$/.test(t)) kinds.add(t);
    }
  }
  return kinds;
}
// The kinds the code actually EMITS, from every `kind: "…"` push site.
function emittedKinds(src) {
  return new Set([...src.matchAll(/kind: "([a-z-]+)"/g)].map((m) => m[1]));
}
// The comparison under test, as data — so a planted source can be run through the SAME logic.
function taxonomyDiff(src) {
  const adv = advertisedKinds(src);
  const emit = emittedKinds(src);
  return {
    advertised: [...adv].sort(),
    emitted: [...emit].sort(),
    onlyInHeader: [...adv].filter((k) => !emit.has(k)).sort(), // advertised but never emitted
    onlyInCode: [...emit].filter((k) => !adv.has(k)).sort(), // emitted but undocumented
  };
}

ok("r11 LOW: the header taxonomy and the emitted kinds are SET-EQUAL (both directions)", () => {
  const src = fs.readFileSync(CHECK, "utf8");
  const d = taxonomyDiff(src);
  assert.ok(d.emitted.length >= 9, `expected the emit sites to be found, got ${d.emitted.length}`);
  assert.deepStrictEqual(d.onlyInCode, [], "the code emits kind(s) the header taxonomy never documents");
  assert.deepStrictEqual(d.onlyInHeader, [], "the header advertises kind(s) no code site emits");
  assert.deepStrictEqual(d.advertised, d.emitted, "the header taxonomy must equal the emitted set exactly");
});

ok("r11 LOW: a PLANTED header-only extra kind turns the taxonomy check RED (the reverse direction has teeth)", () => {
  const src = fs.readFileSync(CHECK, "utf8");
  // Plant `imaginary-kind` in the WARNINGS list — advertised in the header, emitted by nothing.
  // Against the r10 hardcoded-array test this was INVISIBLE; it must now be caught.
  const planted = src.replace(
    " *   dangling-wikilink · non-kebab-name · index-too-long",
    " *   dangling-wikilink · non-kebab-name · index-too-long · imaginary-kind",
  );
  assert.notStrictEqual(planted, src, "the planted fixture must actually modify the header");
  const d = taxonomyDiff(planted);
  assert.deepStrictEqual(d.onlyInHeader, ["imaginary-kind"], "a header-only kind must be detected");
  assert.notDeepStrictEqual(d.advertised, d.emitted, "set equality must FAIL on the planted header");
});

ok("r11 LOW: a PLANTED undocumented emit site also turns the taxonomy check RED (forward direction)", () => {
  const src = fs.readFileSync(CHECK, "utf8");
  const planted = src.replace('kind: "index-too-long"', 'kind: "undocumented-kind"');
  assert.notStrictEqual(planted, src, "the planted fixture must actually modify an emit site");
  const d = taxonomyDiff(planted);
  assert.ok(d.onlyInCode.includes("undocumented-kind"), "an emitted-but-undocumented kind must be detected");
});

// ─────────────────────────────────────────────────────────────────────────────
// gauntlet r12 — the PROSPECTIVE-STATE contract.
//
// memory-apply's pre-check no longer reasons about a replacement BODY; it builds the store record
// this detector WOULD read after a plan is applied and runs evaluate() over it, so that its
// pre-check and its post-check are one computation rather than two that must agree. That makes
// three properties of THIS module load-bearing for a caller, and a silent change to any of them
// would re-open the r12 MEDIUM without anything here going red:
//   1. evaluate() is PURE over a store record — it must never reach for the disk;
//   2. a HAND-BUILT record with readStore()'s field shape evaluates identically to a read one;
//   3. index state is part of that record, so a caller must model index effects to get the same
//      verdict the post-check will reach.
// ─────────────────────────────────────────────────────────────────────────────

ok("r12 CONTRACT: evaluate() is PURE over a store record — no disk, even for a dir that does not exist", () => {
  const res = mod.evaluate({
    stores: [
      {
        dir: path.join(os.tmpdir(), "no-such-store-" + Date.now()),
        indexEntries: [{ line: 1, title: "A", target: "a.md", hook: "h" }],
        indexMalformed: [],
        indexLineCount: 1,
        files: [{ file: "a.md", hasFrontmatter: true, name: "a-slug", description: "d", type: "feedback", wikilinks: [] }],
      },
    ],
  });
  assert.deepStrictEqual(res.findings, [], "a well-formed synthetic store is clean without any file existing");
  assert.deepStrictEqual(res.warnings, [], "and raises no warnings either");
});

ok("r12 CONTRACT: a HAND-BUILT record with readStore's field shape evaluates identically to a read one", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "memint-r12-shape-"));
  const mk = (slug) => `---\nname: ${slug}\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nBody with a [[${slug}]] link.\n`;
  fs.writeFileSync(path.join(dir, "a.md"), mk("a-slug"));
  fs.writeFileSync(path.join(dir, "b.md"), mk("b-slug"));
  fs.writeFileSync(path.join(dir, "MEMORY.md"), "- [A](a.md) — h\n- [B](b.md) — h\n");

  const read = mod.readStore(dir, "store", mod.DEFAULT_MAX_INDEX_LINES);
  const built = {
    dir: "store",
    maxIndexLines: mod.DEFAULT_MAX_INDEX_LINES,
    ...(() => {
      const { entries, lineCount, malformed } = mod.parseIndex("- [A](a.md) — h\n- [B](b.md) — h\n");
      return { indexEntries: entries, indexMalformed: malformed, indexLineCount: lineCount };
    })(),
    files: ["a.md", "b.md"].map((file) => {
      const fm = mod.parseFrontmatter(mk(file === "a.md" ? "a-slug" : "b-slug"));
      return {
        file,
        hasFrontmatter: fm.hasFrontmatter,
        name: fm.name,
        description: fm.description,
        type: fm.type,
        wikilinks: mod.extractWikilinks(fm.body),
      };
    }),
  };
  assert.deepStrictEqual(built, read, "a record built from the exported parsers IS the record readStore produces");
  assert.deepStrictEqual(mod.evaluate({ stores: [built] }), mod.evaluate({ stores: [read] }), "so both evaluate the same");
});

ok("r12 CONTRACT: a replacement body's slug is judged against its SIBLINGS, not on its own", () => {
  const file = (name, slug) => ({ file: name, hasFrontmatter: true, name: slug, description: "d", type: "feedback", wikilinks: [] });
  const index = mod.parseIndex("- [A](a.md) — h\n- [B](b.md) — h\n");
  const state = (bSlug) => ({
    dir: "store",
    indexEntries: index.entries,
    indexMalformed: index.malformed,
    indexLineCount: index.lineCount,
    files: [file("a.md", "a-slug"), file("b.md", bSlug)],
  });
  // b.md's body is structurally perfect in BOTH states — the only difference is the rest of the store.
  assert.deepStrictEqual(mod.evaluate({ stores: [state("b-slug")] }).findings, [], "distinct slugs are clean");
  const collided = mod.evaluate({ stores: [state("a-slug")] }).findings;
  assert.strictEqual(collided.length, 1, `a sibling collision is one finding, got ${JSON.stringify(collided)}`);
  assert.strictEqual(collided[0].kind, "duplicate-name-slug");
  assert.deepStrictEqual(
    mod.frontmatterProblems({ hasFrontmatter: true, name: "a-slug", description: "d", type: "feedback" }),
    [],
    "and the per-FILE validator sees nothing wrong with it — which is exactly why the store-wide state must be projected",
  );
});

ok("r12 CONTRACT: index state is part of the record — a delete must be projected into the index too", () => {
  const files = [{ file: "a.md", hasFrontmatter: true, name: "a-slug", description: "d", type: "feedback", wikilinks: [] }];
  const withStaleLine = mod.parseIndex("- [A](a.md) — h\n- [B](b.md) — h\n");
  const resynced = mod.parseIndex("- [A](a.md) — h\n");
  const stale = mod.evaluate({
    stores: [{ dir: "store", indexEntries: withStaleLine.entries, indexMalformed: withStaleLine.malformed, indexLineCount: withStaleLine.lineCount, files }],
  }).findings;
  assert.ok(
    stale.some((f) => f.kind === "broken-index-pointer"),
    `deleting b.md WITHOUT projecting the index re-sync leaves a broken pointer: ${JSON.stringify(stale)}`,
  );
  const clean = mod.evaluate({
    stores: [{ dir: "store", indexEntries: resynced.entries, indexMalformed: resynced.malformed, indexLineCount: resynced.lineCount, files }],
  }).findings;
  assert.deepStrictEqual(clean, [], "projecting the re-sync as well yields the verdict the post-check will reach");
});

console.log(`\nmemory-integrity: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
