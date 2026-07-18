#!/usr/bin/env node
"use strict";

/**
 * Isolated test for scripts/events/cli.js — the C3 `query --archive` read path
 * (SP-20260718-002, qa-plan Gate #6). Proves the THREE coded branches of
 * `readArchiveStrict` + the two-phase "NO partial output" guarantee:
 *
 *   1. healthy union — live ∪ archived, complete, sorted by ts/id, redundant
 *      compaction-summary suppressed when its raw generation is present.
 *   2. filters preserved across the union (--type).
 *   3. corrupt-dangling — an index entry whose archived file is gone → exit
 *      NON-ZERO + explicit stderr + stdout==="" (no partial output).
 *   4. corrupt-unreadable index (index is a directory) → exit non-zero, stdout empty.
 *   5. corrupt-unparseable line — STRICT parse; a torn index line fails closed
 *      (proves the read path did NOT inherit readIndex's torn-line tolerance).
 *   6. cold-absent tier — no archiveIndexPath → exit 0, live-only, distinct
 *      "no archive tier yet" note (a DISTINCT branch from corrupt, AC-10).
 *   7. backward-compat — query/tail WITHOUT --archive behave exactly as before.
 *
 *   node scripts/events/cli.test.js
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { harness, sealedDir } = require("../checks/lib/fixture-harness");
const cli = require("./cli");

const h = harness("events-cli");

const ARCHIVE_REL = ".claude/runtime/archive";
const GEN_REL = ".claude/runtime/archive/events.jsonl.gen1";
const IDX_REL = ".claude/runtime/archive/index.jsonl";
const LIVE_REL = ".claude/project/events/events.jsonl";

// ── stdout/stderr capture (query() returns an exit code; it does NOT process.exit) ──
function capture(fn) {
  const out = [];
  const err = [];
  const origOut = process.stdout.write;
  const origErr = process.stderr.write;
  process.stdout.write = (s) => {
    out.push(String(s));
    return true;
  };
  process.stderr.write = (s) => {
    err.push(String(s));
    return true;
  };
  let code;
  try {
    code = fn();
  } finally {
    process.stdout.write = origOut;
    process.stderr.write = origErr;
  }
  return { code, stdout: out.join(""), stderr: err.join("") };
}

const jsonl = (...objs) => objs.map((o) => JSON.stringify(o)).join("\n") + "\n";

// The archived generation (older raw), the reseeded live tail, and the summary
// whose ref points at that generation.
const ARCHIVED_EVENTS = [
  { id: "EVT-a1", ts: "2026-07-18T01:00:00Z", type: "prompt", message: "archived-1" },
  { id: "EVT-a2", ts: "2026-07-18T02:00:00Z", type: "decision", message: "archived-2" },
];
const SUMMARY = {
  id: "EVT-sum",
  ts: "2026-07-18T03:00:00Z",
  cat: "audit",
  actor: "compactor",
  type: "compaction-summary",
  data: { event_count: 2, archived_generation_ref: GEN_REL },
};
const LIVE_TAIL = [
  { id: "EVT-t1", ts: "2026-07-18T04:00:00Z", type: "prompt", message: "live-tail-1" },
];

/** A sealed root with a live log + a HEALTHY archive tier (one indexed generation). */
function healthyRoot() {
  const fx = sealedDir(
    {
      [LIVE_REL]: jsonl(SUMMARY, ...LIVE_TAIL),
      [GEN_REL]: jsonl(...ARCHIVED_EVENTS),
      [IDX_REL]: jsonl({
        ts: "2026-07-18T02:30:00Z",
        origin: LIVE_REL,
        archived: GEN_REL,
        reason: "compaction:fold",
        lines: 2,
      }),
    },
    "events-cli-healthy",
  );
  return fx;
}

// ── 1. healthy union: complete, sorted, redundant summary suppressed ─────────
h.test("healthy union: live ∪ archived, sorted by ts/id, redundant summary suppressed", () => {
  const fx = healthyRoot();
  try {
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.code, 0, "healthy tier exits 0");
    const emitted = cap.stdout
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    const ids = emitted.map((e) => e.id);
    // Completeness: every archived raw id AND the live tail id are present.
    assert.deepStrictEqual(ids, ["EVT-a1", "EVT-a2", "EVT-t1"], "union complete + sorted by ts");
    // Redundant summary suppressed (its generation's raw is present in the union).
    assert.ok(
      !emitted.some((e) => e.type === "compaction-summary"),
      "the redundant compaction-summary is suppressed when its raw is present",
    );
  } finally {
    fx.cleanup();
  }
});

// ── 2. filters preserved across the union ────────────────────────────────────
h.test("filters preserved across the union: --type filters BOTH tiers", () => {
  const fx = healthyRoot();
  try {
    const cap = capture(() =>
      cli.query([
        "--archive",
        "--root",
        fx.dir,
        "--source",
        fx.file(LIVE_REL),
        "--type=prompt",
        "--json",
      ]),
    );
    assert.strictEqual(cap.code, 0);
    const ids = cap.stdout
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l).id);
    // EVT-a1 (archived, prompt) + EVT-t1 (live, prompt); EVT-a2 (decision) filtered out.
    assert.deepStrictEqual(ids, ["EVT-a1", "EVT-t1"], "--type filters across live AND archived");
  } finally {
    fx.cleanup();
  }
});

// ── 3. corrupt-dangling: missing generation → non-zero + stdout==="" ─────────
h.violation("corrupt-dangling: index references a removed generation → non-zero, NO partial output", () => {
  const fx = sealedDir(
    {
      [LIVE_REL]: jsonl(...LIVE_TAIL),
      // index points at a generation that is NOT on disk (dangling).
      [IDX_REL]: jsonl({ origin: LIVE_REL, archived: GEN_REL, reason: "compaction:fold" }),
    },
    "events-cli-dangling",
  );
  try {
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.stdout, "", "NO partial output on a corrupt/dangling tier");
    assert.ok(/corrupt|dangling|missing/i.test(cap.stderr), "explicit fail-closed stderr");
    assert.ok(/fail-closed/i.test(cap.stderr), "the fail-closed note is present");
    assert.notStrictEqual(cap.code, 0, "corrupt tier exits non-zero");
    return cap.code; // non-zero → isPass=false → correctly a planted-violation FAIL
  } finally {
    fx.cleanup();
  }
});

// ── 4. corrupt-unreadable index (index is a directory) → non-zero, stdout empty ──
h.violation("corrupt-unreadable index → non-zero, stdout empty", () => {
  const fx = sealedDir({ [LIVE_REL]: jsonl(...LIVE_TAIL) }, "events-cli-unreadable");
  try {
    // Make index.jsonl a DIRECTORY: existsSync true, readFileSync throws → corrupt (c).
    fs.mkdirSync(fx.file(IDX_REL), { recursive: true });
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.stdout, "", "NO partial output on an unreadable index");
    assert.ok(/corrupt|unreadable/i.test(cap.stderr), "explicit stderr for unreadable index");
    assert.notStrictEqual(cap.code, 0, "unreadable index exits non-zero");
    return cap.code;
  } finally {
    fx.cleanup();
  }
});

// ── 5. corrupt-unparseable line: STRICT parse — did NOT inherit readIndex tolerance ──
h.violation("corrupt-unparseable index line → non-zero (STRICT; does NOT skip like readIndex)", () => {
  const fx = sealedDir(
    {
      [LIVE_REL]: jsonl(...LIVE_TAIL),
      // A torn/unparseable index line. readIndex would SKIP it and read []; the
      // strict read path MUST fail closed instead.
      [IDX_REL]: "{ this is not json\n",
    },
    "events-cli-unparseable",
  );
  try {
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.stdout, "", "NO partial output on an unparseable index line");
    assert.ok(/unparseable|corrupt/i.test(cap.stderr), "explicit stderr for the strict-parse failure");
    assert.notStrictEqual(cap.code, 0, "an unparseable index line fails closed (non-zero)");
    // Direct proof of divergence from readIndex's tolerance on the SAME input.
    const archive = require("../hooks/lib/archive");
    assert.strictEqual(
      archive.readIndex(fx.dir).length,
      0,
      "readIndex tolerates (skips) the torn line — the strict read path does NOT",
    );
    return cap.code;
  } finally {
    fx.cleanup();
  }
});

// ── 6. cold-absent tier: no index → exit 0, live-only, DISTINCT note ─────────
h.test("cold-absent tier: no archive index → exit 0, live-only, 'no archive tier yet' note (distinct from corrupt)", () => {
  const fx = sealedDir({ [LIVE_REL]: jsonl(...LIVE_TAIL) }, "events-cli-cold");
  try {
    assert.ok(!fs.existsSync(fx.file(IDX_REL)), "precondition: no archive index exists");
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.code, 0, "COLD path exits 0 — an absent tier is NOT an error");
    const ids = cap.stdout
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l).id);
    assert.deepStrictEqual(ids, ["EVT-t1"], "live-only output");
    // DISTINCT branch: the note path — NOT the corrupt/fail-closed message.
    assert.ok(/no archive tier yet/i.test(cap.stderr), "the distinct COLD note is present");
    assert.ok(!/fail-closed/i.test(cap.stderr), "COLD is NOT the fail-closed corrupt branch");
  } finally {
    fx.cleanup();
  }
});

// ── 7. backward-compat: query WITHOUT --archive is unchanged ─────────────────
h.test("backward-compat: query without --archive reads live-only and ignores the archive tier", () => {
  const fx = healthyRoot(); // a full archive tier EXISTS but must be ignored
  try {
    const cap = capture(() =>
      cli.query(["--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.code, 0);
    const types = cap.stdout
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l).type);
    // Live file only: the compaction-summary + the tail — NO archived generation,
    // and NO suppression (that is an --archive-only behavior).
    assert.ok(types.includes("compaction-summary"), "no --archive → summary NOT suppressed");
    const ids = cap.stdout.split("\n").filter(Boolean).map((l) => JSON.parse(l).id);
    assert.ok(!ids.includes("EVT-a1"), "no --archive → archived raw is NOT unioned in");
  } finally {
    fx.cleanup();
  }
});

// ── 8. cold-absent stays visible: a summary whose raw is genuinely absent is a pointer ──
h.test("summary pointer: with no archive tier, a compaction-summary stays VISIBLE (not suppressed)", () => {
  const fx = sealedDir({ [LIVE_REL]: jsonl(SUMMARY, ...LIVE_TAIL) }, "events-cli-pointer");
  try {
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.code, 0, "cold tier → exit 0");
    const types = cap.stdout
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l).type);
    assert.ok(
      types.includes("compaction-summary"),
      "a summary whose raw is genuinely absent stays visible as a pointer",
    );
  } finally {
    fx.cleanup();
  }
});

// ── 9. SEC-3 bidirectional completeness: an un-indexed generation on disk fails closed ──
// The never-lose-raw READ teeth. A raw generation present in the archive dir but
// NOT referenced by the index (the compactor's S7 index_pending window, or a
// reconcile-pending orphan) must NOT be silently omitted while the reader reports
// "healthy". Without the files->index scan this returns a clean-looking partial
// history that drops real raw events.
const GEN2_REL = ".claude/runtime/archive/events.jsonl.gen2";
h.violation("SEC-3 un-indexed generation on disk → fail-closed (never silently omit raw)", () => {
  const fx = sealedDir(
    {
      [LIVE_REL]: jsonl(SUMMARY, ...LIVE_TAIL),
      [GEN_REL]: jsonl(...ARCHIVED_EVENTS),
      // A SECOND generation ON DISK but absent from the index (unindexed raw).
      [GEN2_REL]: jsonl({ id: "EVT-orphan", ts: "2026-07-18T02:45:00Z", type: "prompt", message: "orphaned-raw" }),
      [IDX_REL]: jsonl({ origin: LIVE_REL, archived: GEN_REL, reason: "compaction:fold", lines: 2 }),
    },
    "events-cli-unindexed-gen",
  );
  try {
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.stdout, "", "NO partial output when raw exists on disk but is un-indexed");
    assert.ok(/un-indexed generation/i.test(cap.stderr), "explicit un-indexed-generation error");
    assert.notStrictEqual(cap.code, 0, "un-indexed raw on disk fails closed (non-zero)");
    return cap.code;
  } finally {
    fx.cleanup();
  }
});

// ── 10. BR-2 dedup: a reseeded event present in BOTH live tail and archive appears ONCE ──
h.test("BR-2 union dedup: an event in both the live tail AND its archived generation appears once", () => {
  // EVT-a2 is reseeded into the live tail AND still lives in the archived generation.
  const fx = sealedDir(
    {
      [LIVE_REL]: jsonl(SUMMARY, ARCHIVED_EVENTS[1], ...LIVE_TAIL), // EVT-a2 reseeded into live
      [GEN_REL]: jsonl(...ARCHIVED_EVENTS), // EVT-a1, EVT-a2 in the archive
      [IDX_REL]: jsonl({ origin: LIVE_REL, archived: GEN_REL, reason: "compaction:fold", lines: 2 }),
    },
    "events-cli-dedup",
  );
  try {
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.code, 0);
    const ids = cap.stdout.split("\n").filter(Boolean).map((l) => JSON.parse(l).id);
    // EVT-a2 must appear EXACTLY ONCE despite being in both tiers.
    assert.strictEqual(ids.filter((x) => x === "EVT-a2").length, 1, "reseeded event deduped to a single copy");
    assert.deepStrictEqual(ids, ["EVT-a1", "EVT-a2", "EVT-t1"], "complete union, no duplicate");
  } finally {
    fx.cleanup();
  }
});

// ── 11. BR-6 live-read fail-closed: an existing-but-unreadable live file → non-zero, no output ──
h.violation("BR-6 unreadable live file → fail-closed (not a silent empty history)", () => {
  const fx = healthyRoot();
  try {
    // Make the live log a DIRECTORY: it exists (not ENOENT) but is unreadable as a file.
    fs.rmSync(fx.file(LIVE_REL), { force: true });
    fs.mkdirSync(fx.file(LIVE_REL), { recursive: true });
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.stdout, "", "NO partial output on an unreadable live file");
    assert.ok(/not a regular file|unreadable|inaccessible/i.test(cap.stderr), "explicit fail-closed stderr");
    assert.notStrictEqual(cap.code, 0, "unreadable live file fails closed (non-zero)");
    return cap.code;
  } finally {
    fx.cleanup();
  }
});

// ── 12. BR-9 path-aware completeness: a same-basename decoy elsewhere does NOT cover an un-indexed generation ──
// An un-indexed raw generation lives in the archive dir; the index references a
// DIFFERENT in-root file with the SAME basename. A basename-only completeness check
// would call this "healthy" and silently omit the archive-dir raw. The path-aware
// check (resolved abs path, dirname === archive dir) must FAIL CLOSED.
const DECOY_REL = "docs/events.jsonl.genX";
const REAL_GEN_REL = ".claude/runtime/archive/events.jsonl.genX";
h.violation("BR-9 same-basename decoy does NOT cover an un-indexed archive generation → fail-closed", () => {
  const fx = sealedDir(
    {
      [LIVE_REL]: jsonl(...LIVE_TAIL),
      // A REAL raw generation on disk in the archive dir, NOT properly indexed:
      [REAL_GEN_REL]: jsonl({ id: "EVT-realgen", ts: "2026-07-18T02:20:00Z", type: "prompt", message: "real-archived-raw" }),
      // A DECOY file elsewhere in-root with the SAME basename that the index points at:
      [DECOY_REL]: jsonl({ id: "EVT-decoy", ts: "2026-07-18T02:21:00Z", type: "prompt", message: "decoy" }),
      [IDX_REL]: jsonl({ origin: LIVE_REL, archived: DECOY_REL, reason: "compaction:fold", lines: 1 }),
    },
    "events-cli-basename-decoy",
  );
  try {
    const cap = capture(() =>
      cli.query(["--archive", "--root", fx.dir, "--source", fx.file(LIVE_REL), "--json"]),
    );
    assert.strictEqual(cap.stdout, "", "NO partial output — the archive-dir raw is un-indexed");
    assert.ok(/un-indexed generation/i.test(cap.stderr), "path-aware check flags the un-indexed generation");
    assert.notStrictEqual(cap.code, 0, "a same-basename decoy must NOT satisfy completeness (fail-closed)");
    return cap.code;
  } finally {
    fx.cleanup();
  }
});

h.done();
