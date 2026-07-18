#!/usr/bin/env node
/**
 * scripts/events/cli.js — Tail / query the events log.
 *
 * Subcommands:
 *   tail [-n <count>] [--source <file>]      Last <count> events (default 20).
 *   query [--type=...] [--since=...]         Filter by type/category/since.
 *   query --archive [--root <dir>]           Union live events with archived raw.
 *   query --help                             Show flag reference.
 *
 * Reads `paths.eventsFile` by default. `--source` overrides for fixture testing.
 *
 * `--archive` (C3, SP-20260718-002): union the LIVE events file with the archived
 * raw generations so live ∪ archive = COMPLETE history. The archive tier is read
 * through a STRICT completeness reader (`readArchiveStrict`) with THREE coded
 * branches — absent (COLD, exit 0, live-only), corrupt (FAIL-CLOSED, non-zero, NO
 * output), healthy (union). The read path deliberately does NOT inherit
 * archive.js#readIndex's torn-line tolerance: an incomplete/torn INDEX must fail
 * closed rather than masquerade as a "clean" partial history (two-phase
 * validate-then-emit guarantees no partial output on corruption).
 *
 * Exit:
 *   0 — success
 *   1 — events file missing or unreadable, OR (`--archive`) a corrupt/dangling/
 *       unreadable archive tier (fail-closed, no partial output)
 *   2 — usage error
 *
 * Empty-state behavior:
 *   tail/query against an empty events file prints `events log is empty — start the system and try again` to stderr and exits 0.
 */
const fs = require("fs");
const path = require("path");

function loadPaths() {
  try {
    return require("../hooks/lib/paths").PATHS;
  } catch {
    return { eventsFile: ".claude/project/events/events.jsonl" };
  }
}

/**
 * Parse JSONL text into event objects, tolerating a torn/partial line (skip it).
 * This is the EVENT-LEVEL tolerance: a torn line INSIDE a raw generation file is
 * skipped exactly as `archive.js#readIndex` and the live reader do today. The
 * fail-closed strictness in `readArchiveStrict` is INDEX-scoped (the completeness
 * map), NOT event-scoped — the two classes are deliberately different.
 */
function parseJsonl(text) {
  if (!text || !text.trim()) return [];
  const out = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* skip malformed line — preserves availability under partial writes */
    }
  }
  return out;
}

function readJsonl(file) {
  if (!fs.existsSync(file)) {
    process.stderr.write(`events file not found: ${file}\n`);
    process.exit(1);
  }
  return parseJsonl(fs.readFileSync(file, "utf8"));
}

/**
 * Read a JSONL file WITHOUT exiting when it is missing (returns []). Used on the
 * `--archive` union path, where a freshly-rotated live log may not yet exist
 * (recreate-on-next-append) while the archive tier still holds the raw history.
 */
function readJsonlSafe(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }
  return parseJsonl(text);
}

/** Lazy-load the archive tier module (fs/path-only, no side effects on require). */
function loadArchive() {
  try {
    return require("../hooks/lib/archive");
  } catch {
    return null;
  }
}

/**
 * readArchiveStrict(root) — the STRICT, two-phase completeness reader for the
 * archive tier. THREE coded branches (build_spec §C3):
 *
 *   { tier: "absent" }
 *       COLD / fresh install — no archive index exists yet. Not an error: the
 *       caller shows live-only + a "no archive tier yet" note + exit 0 (AC-10).
 *
 *   { tier: "corrupt", error }
 *       FAIL-CLOSED (AC-9). The index exists AND one of:
 *         (a) any non-empty index line fails JSON.parse — STRICT; we do NOT skip
 *             torn lines the way readIndex does (that tolerance would let a torn
 *             index masquerade as a complete history);
 *         (b) any entry's `archived` generation is missing / unreadable / not a
 *             regular file / escapes root (dangling);
 *         (c) the index file itself is unreadable.
 *       The caller prints an explicit error and exits non-zero with NO output.
 *
 *   { tier: "healthy", entries, presentRefs }
 *       The index exists, every line parses, and every referenced generation is
 *       present + readable. `entries` = every archived raw event (event-level
 *       torn lines inside a generation tolerated); `presentRefs` = the set of
 *       `archived` rel-paths whose raw is present (drives summary suppression).
 *
 * TWO-PHASE guarantee: Phase 1 VALIDATES the entire index + the existence and
 * readability of EVERY referenced generation before Phase 2 parses/EMITS any
 * event. We never stream-then-discover-corruption, so a corrupt tier yields NO
 * partial output. NEVER throws.
 */
function readArchiveStrict(root) {
  const archive = loadArchive();
  if (!archive) {
    return { tier: "corrupt", error: "archive module unavailable — cannot verify tier completeness" };
  }
  let rootAbs;
  let idxPath;
  try {
    rootAbs = path.resolve(root);
    idxPath = archive.archiveIndexPath(rootAbs);
  } catch {
    return { tier: "corrupt", error: "cannot resolve archive index path" };
  }

  // Branch: ABSENT (COLD) — a never-archived system. Distinct from corrupt.
  if (!fs.existsSync(idxPath)) {
    return { tier: "absent" };
  }

  // The index exists → read it. Unreadable index (e.g. a directory / perms) → corrupt (c).
  let raw;
  try {
    raw = fs.readFileSync(idxPath, "utf8");
  } catch {
    return { tier: "corrupt", error: `archive index unreadable: ${idxPath}` };
  }

  // Phase 1a — STRICT parse of every non-empty index line (no torn-line tolerance).
  const indexEntries = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    let entry;
    try {
      entry = JSON.parse(t);
    } catch {
      return {
        tier: "corrupt",
        error: "archive index has an unparseable line (strict parse) — history may be incomplete",
      };
    }
    indexEntries.push(entry);
  }

  // Phase 1b — VALIDATE existence + readability of EVERY referenced generation
  // BEFORE emitting anything. Buffer the raw content; only Phase 2 parses it.
  const genBuffers = [];
  const presentRefs = [];
  for (const entry of indexEntries) {
    const rel = entry && entry.archived;
    if (typeof rel !== "string" || !rel) {
      return { tier: "corrupt", error: "archive index entry missing an `archived` reference" };
    }
    // Resolve inside root (containment) — a generation ref that escapes root is corrupt.
    const genAbs = path.resolve(rootAbs, rel);
    if (!archive.resolveInsideRoot(rootAbs, genAbs)) {
      return { tier: "corrupt", error: `archived generation escapes root: ${rel}` };
    }
    let content;
    try {
      const st = fs.lstatSync(genAbs); // no symlink-follow
      if (!st.isFile()) {
        return { tier: "corrupt", error: `archived generation is not a regular file (dangling): ${rel}` };
      }
      content = fs.readFileSync(genAbs, "utf8");
    } catch {
      return { tier: "corrupt", error: `archived generation missing or unreadable (dangling): ${rel}` };
    }
    genBuffers.push(content);
    presentRefs.push(rel);
  }

  // Phase 2 — EMIT. Every generation validated; now parse the raw events.
  const entries = [];
  for (const content of genBuffers) {
    for (const e of parseJsonl(content)) entries.push(e);
  }
  return { tier: "healthy", entries, presentRefs };
}

/** Stable union ordering: by ts (ISO sorts chronologically), tie-broken by id. */
function compareByTsId(a, b) {
  const ta = (a && (a.ts || a.timestamp)) || "";
  const tb = (b && (b.ts || b.timestamp)) || "";
  if (ta < tb) return -1;
  if (ta > tb) return 1;
  const ia = (a && a.id) || "";
  const ib = (b && b.id) || "";
  if (ia < ib) return -1;
  if (ia > ib) return 1;
  return 0;
}

/**
 * Reader-experience (build_spec §C3): when a compaction-summary's archived
 * generation is PRESENT in the union, suppress the redundant summary (the raw it
 * points at is right there). A summary whose ref is null / does not resolve to a
 * present generation (e.g. an S7 `index_pending` pointer) STAYS VISIBLE as a
 * pointer. Non-summary events always pass through.
 */
function suppressRedundantSummaries(events, presentRefs) {
  const present = new Set(presentRefs || []);
  return events.filter((e) => {
    if (
      e &&
      e.type === "compaction-summary" &&
      e.data &&
      typeof e.data.archived_generation_ref === "string" &&
      present.has(e.data.archived_generation_ref)
    ) {
      return false; // raw present in the union → redundant summary suppressed
    }
    return true;
  });
}

function getArg(args, ...names) {
  for (const n of names) {
    const i = args.indexOf(n);
    if (i !== -1 && i + 1 < args.length) return args[i + 1];
    const eq = args.find((a) => a.startsWith(`${n}=`));
    if (eq) return eq.slice(n.length + 1);
  }
  return null;
}

function tail(args) {
  const PATHS = loadPaths();
  const file = getArg(args, "--source") || PATHS.eventsFile;
  const n = parseInt(getArg(args, "-n", "--count") || "20", 10);
  const events = readJsonl(file);
  if (events.length === 0) {
    process.stderr.write(
      "events log is empty — start the system and try again\n",
    );
    return 0;
  }
  const slice = events.slice(-n);
  for (const e of slice) {
    const ts = e.ts || e.timestamp || "";
    const type = e.type || e.event || "?";
    const msg = e.message || e.summary || JSON.stringify(e);
    process.stdout.write(`${ts}  ${type}  ${msg}\n`);
  }
  return 0;
}

function query(args) {
  if (args.includes("--help")) {
    process.stdout.write(
      [
        "query flags:",
        "  --type=<str>       filter by event.type",
        "  --since=<ISO>      events with ts >= ISO",
        "  --until=<ISO>      events with ts <= ISO",
        "  --grep=<regex>     match against JSON-serialized event",
        "  --source=<file>    override events file (fixture testing)",
        "  --archive          union live events with archived raw (complete history)",
        "  --root=<dir>       project root for the archive tier (default: cwd; with --archive)",
        "  --json             emit one JSON per match (default text)",
      ].join("\n") + "\n",
    );
    return 0;
  }
  const PATHS = loadPaths();
  const file = getArg(args, "--source") || PATHS.eventsFile;
  const type = getArg(args, "--type");
  const since = getArg(args, "--since");
  const until = getArg(args, "--until");
  const grep = getArg(args, "--grep");
  const asJson = args.includes("--json");
  const useArchive = args.includes("--archive");

  let events;
  if (useArchive) {
    // TWO-PHASE fail-closed: VALIDATE the archive tier completely BEFORE reading
    // live or writing ANY stdout, so a corrupt tier produces NO partial output.
    const root = getArg(args, "--root") || process.cwd();
    const arch = readArchiveStrict(root);
    if (arch.tier === "corrupt") {
      process.stderr.write(`error: archive tier is corrupt — ${arch.error}\n`);
      process.stderr.write(
        "fail-closed: refusing to print a partial/incomplete history (no output)\n",
      );
      return 1; // NON-ZERO, and nothing has been written to stdout
    }
    const liveEvents = readJsonlSafe(file);
    if (arch.tier === "absent") {
      // COLD path (AC-10): a never-archived system. Live-only, distinct note, exit 0.
      process.stderr.write("note: no archive tier yet — showing live events only\n");
      events = liveEvents.slice();
    } else {
      // healthy: union live ∪ archived, suppress redundant summaries, sort by ts/id.
      events = suppressRedundantSummaries(
        liveEvents.concat(arch.entries),
        arch.presentRefs,
      );
    }
    events.sort(compareByTsId);
  } else {
    events = readJsonl(file);
  }
  if (events.length === 0) {
    process.stderr.write(
      "events log is empty — start the system and try again\n",
    );
    return 0;
  }
  const grepRe = grep ? new RegExp(grep) : null;
  let matched = 0;
  for (const e of events) {
    if (type && (e.type || e.event) !== type) continue;
    const ts = e.ts || e.timestamp || "";
    if (since && ts < since) continue;
    if (until && ts > until) continue;
    if (grepRe && !grepRe.test(JSON.stringify(e))) continue;
    matched++;
    if (asJson) {
      process.stdout.write(JSON.stringify(e) + "\n");
    } else {
      process.stdout.write(
        `${ts}  ${e.type || e.event || "?"}  ${e.message || e.summary || ""}\n`,
      );
    }
  }
  process.stderr.write(`# ${matched} match(es)\n`);
  return 0;
}

function main() {
  const [, , sub, ...rest] = process.argv;
  if (!sub || sub === "--help") {
    process.stdout.write(
      "usage: node scripts/events/cli.js <tail|query> [args]\n",
    );
    process.exit(sub ? 0 : 2);
  }
  if (sub === "tail") process.exit(tail(rest));
  if (sub === "query") process.exit(query(rest));
  process.stderr.write(`unknown subcommand: ${sub}\n`);
  process.exit(2);
}

if (require.main === module) main();

module.exports = {
  tail,
  query,
  readJsonl,
  readJsonlSafe,
  parseJsonl,
  readArchiveStrict,
  suppressRedundantSummaries,
  compareByTsId,
};
