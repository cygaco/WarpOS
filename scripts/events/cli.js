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
 * Realpath-based containment (SEC-1 fix, gauntlet R1). archive.js hardens its own
 * WRITE path with a realpath `containResolved` (ADR-0017) but does NOT export it,
 * and archive.js is FROZEN this sprint — so the READ path replicates the guard
 * locally: resolve the candidate, realpath its nearest EXISTING ancestor, and
 * refuse anything whose REAL location escapes root. Lexical containment alone
 * (path prefix) misses a junction/symlink ANCESTOR that redirects the read OUT of
 * root while the lexical path still looks in-root. Returns the safe absolute path,
 * or null (fail-closed). NEVER throws.
 */
function containedReal(rootAbs, candidate) {
  try {
    const lexical = path.resolve(candidate);
    const sep = rootAbs.endsWith(path.sep) ? rootAbs : rootAbs + path.sep;
    if (lexical !== rootAbs && !lexical.startsWith(sep)) return null;
    let probe = lexical;
    let real = null;
    for (let i = 0; i < 128; i++) {
      try {
        real = fs.realpathSync(probe);
        break;
      } catch (e) {
        if (e && e.code === "ENOENT") {
          const parent = path.dirname(probe);
          if (parent === probe) return null;
          probe = parent;
          continue;
        }
        return null; // any other stat/perm fault → fail-closed
      }
    }
    if (real === null) return null;
    if (real !== rootAbs && !real.startsWith(sep)) return null; // real ancestor escapes root
    const suffix = path.relative(probe, lexical);
    if (suffix.startsWith("..")) return null;
    const composed = suffix ? path.join(real, suffix) : real;
    if (composed !== rootAbs && !composed.startsWith(sep)) return null;
    return composed;
  } catch {
    return null;
  }
}

/**
 * Live-log read for the `--archive` union that DISTINGUISHES a genuinely-absent
 * file (ENOENT → ok, []: recreate-on-next-append is normal) from an existing but
 * UNREADABLE / non-regular file (permission, I/O, a directory → fail-closed).
 * BR-6 (gauntlet R1): the old readJsonlSafe collapsed EVERY failure into [], so an
 * unreadable live file silently produced an incomplete "clean" history under
 * `--archive`. Returns { ok, events } | { ok:false, error }.
 */
function readLiveStrict(file) {
  let st;
  try {
    st = fs.lstatSync(file);
  } catch (e) {
    if (e && e.code === "ENOENT") return { ok: true, events: [] };
    return { ok: false, error: `live events file inaccessible: ${file}` };
  }
  if (!st.isFile()) return { ok: false, error: `live events path is not a regular file: ${file}` };
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return { ok: false, error: `live events file unreadable: ${file}` };
  }
  return { ok: true, events: parseJsonl(text) };
}

/**
 * Dedup a union by stable event identity (BR-2, gauntlet R1). The compactor
 * archives the WHOLE file and reseeds the last TAIL_KEEP raw events into the live
 * log, so every reseeded event appears in BOTH the live tail AND its archived
 * generation — without dedup the union emits each reseeded event twice (and can
 * multiply across generations). Dedup by `id`, keeping the first occurrence; an
 * event with no id is kept as-is (never drop an unkeyed event on a heuristic).
 */
function dedupById(events) {
  const seen = new Set();
  const out = [];
  for (const e of events) {
    const id = e && e.id;
    if (id === undefined || id === null || id === "") {
      out.push(e);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(e);
  }
  return out;
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

  // Branch: ABSENT (COLD) vs DANGLING/INACCESSIBLE (fail-closed). SEC-4 (gauntlet
  // R1): fs.existsSync collapses a DANGLING symlink or an INACCESSIBLE index into
  // "false", so the old code treated that as a clean cold install and printed
  // live-only exit 0. Distinguish ENOENT (genuinely never-archived → cold) from
  // any other stat outcome (exists-but-broken / not-a-regular-file → fail-closed).
  let idxStat;
  try {
    idxStat = fs.lstatSync(idxPath);
  } catch (e) {
    if (e && e.code === "ENOENT") return { tier: "absent" };
    return { tier: "corrupt", error: `archive index inaccessible (not a clean cold install): ${idxPath}` };
  }
  if (!idxStat.isFile()) {
    return { tier: "corrupt", error: `archive index is not a regular file: ${idxPath}` };
  }
  // Realpath-contain the index (SEC-1): a junction/symlink ANCESTOR could redirect
  // the index read out of root even though the lexical path looks in-root.
  const idxSafe = containedReal(rootAbs, idxPath);
  if (!idxSafe) {
    return { tier: "corrupt", error: `archive index escapes root (realpath): ${idxPath}` };
  }

  // The index exists → read the REAL, contained path. Unreadable → corrupt (c).
  let raw;
  try {
    raw = fs.readFileSync(idxSafe, "utf8");
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

  // The archive dir (realpath-contained) — HOISTED so BOTH Phase 1b (every index
  // entry must reference a file DIRECTLY inside it, BR-10) and Phase 1c (files→index
  // completeness, SEC-3/BR-9) share the same trusted dir.
  let dirSafe;
  try {
    dirSafe = containedReal(rootAbs, archive.archiveDir(rootAbs));
  } catch {
    dirSafe = null;
  }
  if (!dirSafe) {
    return { tier: "corrupt", error: "archive dir escapes root (realpath)" };
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
    // REALPATH containment (SEC-1): a junction/symlink ancestor could redirect the
    // generation read out of root. Lexical resolveInsideRoot alone misses that.
    const genSafe = containedReal(rootAbs, path.resolve(rootAbs, rel));
    if (!genSafe) {
      return { tier: "corrupt", error: `archived generation escapes root (realpath): ${rel}` };
    }
    // BR-10 (gauntlet R3): an index entry's generation MUST live DIRECTLY inside the
    // archive dir. Without this, an indexed decoy elsewhere in-root (e.g.
    // docs/events.jsonl.genX) is accepted as a "healthy" generation and emitted as
    // raw — an out-of-archive file masquerading as archived history. Fail closed.
    if (path.dirname(genSafe) !== dirSafe) {
      return {
        tier: "corrupt",
        error: `archived generation is not inside the archive dir (decoy?): ${rel}`,
      };
    }
    let content;
    try {
      const st = fs.lstatSync(genSafe); // no symlink-follow
      if (!st.isFile()) {
        return { tier: "corrupt", error: `archived generation is not a regular file (dangling): ${rel}` };
      }
      content = fs.readFileSync(genSafe, "utf8");
    } catch {
      return { tier: "corrupt", error: `archived generation missing or unreadable (dangling): ${rel}` };
    }
    genBuffers.push(content);
    presentRefs.push(rel);
  }

  // Phase 1c — BIDIRECTIONAL completeness (SEC-3, gauntlet R1). Phase 1b proved
  // index→files (every index entry has a present generation). Now prove files→
  // index: scan the archive dir and refuse if ANY generation file on disk is NOT
  // referenced by the index. A raw generation present on disk but absent from the
  // index (the compactor's S7 `index_pending` window, or a reconcile-pending
  // orphan) would otherwise be SILENTLY OMITTED while the reader reports
  // "healthy" — a never-lose-raw READ gap. Fail closed loudly instead of
  // returning a clean-looking partial history. (dirSafe is hoisted above Phase 1b.)
  let dirents;
  try {
    dirents = fs.readdirSync(dirSafe, { withFileTypes: true });
  } catch {
    return { tier: "corrupt", error: "archive dir unreadable" };
  }
  // BR-9 (gauntlet R2): compare RESOLVED ABSOLUTE PATHS, not basenames. An index
  // entry referencing a DIFFERENT in-root file with the SAME basename as an
  // unindexed generation would otherwise falsely "cover" it. Only an index entry
  // whose `archived` realpath-resolves to a file DIRECTLY inside the archive dir
  // counts as covering the generation of that same resolved path.
  const indexedGenReal = new Set();
  for (const e of indexEntries) {
    const rel = e && e.archived;
    if (typeof rel !== "string" || !rel) continue;
    const abs = containedReal(rootAbs, path.resolve(rootAbs, rel));
    if (abs && path.dirname(abs) === dirSafe) indexedGenReal.add(abs);
  }
  for (const d of dirents) {
    if (!d.isFile()) continue;
    if (d.name === archive.INDEX_BASENAME) continue; // the index itself
    if (d.name.endsWith(".lock")) continue; // rotation/compaction lock sidecars
    const genReal = containedReal(rootAbs, path.join(dirSafe, d.name));
    if (!genReal || !indexedGenReal.has(genReal)) {
      return {
        tier: "corrupt",
        error:
          `archive has an un-indexed generation on disk (raw history not in the index): ${d.name} — ` +
          "run the compactor/reconcile to re-index before querying (fail-closed to never omit raw)",
      };
    }
  }

  // Phase 2 — EMIT. Every generation validated + completeness proven both ways.
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
    // Live read is STRICT here (BR-6): an existing-but-unreadable live file must
    // fail closed, not silently reduce to []. Still no stdout written yet, so a
    // failure here honors the two-phase no-partial-output guarantee.
    const liveRes = readLiveStrict(file);
    if (!liveRes.ok) {
      process.stderr.write(`error: ${liveRes.error}\n`);
      process.stderr.write(
        "fail-closed: refusing to print a partial/incomplete history (no output)\n",
      );
      return 1;
    }
    const liveEvents = liveRes.events;
    if (arch.tier === "absent") {
      // COLD path (AC-10): a never-archived system. Live-only, distinct note, exit 0.
      process.stderr.write("note: no archive tier yet — showing live events only\n");
      events = liveEvents.slice();
    } else {
      // healthy: union live ∪ archived, DEDUP by id (BR-2 — the reseeded tail lives
      // in both live and its archived generation), suppress redundant summaries.
      events = dedupById(
        suppressRedundantSummaries(
          liveEvents.concat(arch.entries),
          arch.presentRefs,
        ),
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
  readLiveStrict,
  parseJsonl,
  containedReal,
  dedupById,
  readArchiveStrict,
  suppressRedundantSummaries,
  compareByTsId,
};
