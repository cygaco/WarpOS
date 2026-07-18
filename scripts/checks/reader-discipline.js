#!/usr/bin/env node
"use strict";

/**
 * reader-discipline.js — the query-first reader-discipline enforcer
 * (SP-20260718-002 · C4 · R-5 / S-14 / AC-12).
 *
 * Doctrine: `.claude/project/reference/reader-discipline.md`. The events log is
 * raw truth (CORE-4 / P7.4); reads go through materialized state files or
 * `events:query` (incl. `--archive` for complete live ∪ archive history). A
 * DIRECT full-log read is the exception, sanctioned only for the events
 * subsystem itself. Since the compactor folds old raw into the archive tier, a
 * hand-rolled read of `events.jsonl` sees only the live TAIL and silently
 * reports a PARTIAL answer as complete — which is exactly what this check
 * exists to surface.
 *
 * SOUND-DIRECTION, not sound-complete (build_spec §C4 ruling). A soundly
 * COMPLETE check is infeasible — full-log reads have unbounded spellings
 * (computed paths held in a variable, subprocess reads, re-exported LOG_FILE
 * aliases, concatenated literals; undecidable). So this ships a CLOSED allowlist
 * of sanctioned readers + a scan that flags any OTHER `scripts/**` file reading
 * the events-file literal via a read-call form. It is tuned for ZERO FALSE
 * POSITIVES (precision over completeness); the residual it cannot soundly catch
 * is tracked as **ED-222** (logged by the sprint conductor ε — not by this
 * unit). Honest per AC-12: the policy names its enforcer AND its gap.
 *
 * NEVER throws for a data condition; any scan FAULT degrades to a loud non-zero
 * (exit 2, fail-closed for a check) — never a silent green.
 *
 * Exit contract (mirrors scripts/checks/log-sink-caps.js):
 *   (no flag)   REPORT-ONLY — prints findings, exits 0 even on a violation.
 *   --enforce   exits 1 on any un-sanctioned reader.
 *   own runner error (unreadable tree / crash) → exit 2, fail-closed.
 *
 *   node scripts/checks/reader-discipline.js [--enforce] [--json] [--root <dir>]
 */

const fs = require("fs");
const path = require("path");

const NAME = "reader-discipline";

// ── CLOSED allowlist of sanctioned readers (exact repo-relative POSIX paths) ──
// These files ARE the events subsystem (query surface + logger/rotate/archive/
// retention machinery + compactor + materializers) and may read the log literal
// directly. Any `*.test.js` reads fixtures/log by design. `reader-discipline.js`
// itself is self-excluded: it contains the literal in DETECTION regexes/strings,
// it is not a reader of the log.
const ALLOWLIST = new Set([
  "scripts/events/cli.js",
  "scripts/hooks/lib/logger.js",
  "scripts/hooks/lib/rotate.js",
  "scripts/hooks/lib/archive.js",
  "scripts/hooks/lib/retention.js",
  "scripts/materialize-decisions.js",
  "scripts/state/materialize.js",
  "scripts/state/materialize-core.js",
  "scripts/events/events-compact.js",
]);

const SELF = "scripts/checks/reader-discipline.js";

/** A file is a sanctioned reader iff it is on the CLOSED allowlist, is a test
 *  file, or is this scanner itself. `rel` MUST be a POSIX repo-relative path. */
function isSanctioned(rel) {
  if (typeof rel !== "string" || !rel) return false;
  const p = rel.replace(/\\/g, "/");
  if (p === SELF) return true;
  if (p.endsWith(".test.js")) return true;
  return ALLOWLIST.has(p);
}

// ── Comment stripper (preserves line numbers) ────────────────────────────────
// Strip `//` line comments and `/* */` block comments so a doctrine-quoting
// COMMENT can never be mistaken for a read call (precision → zero false
// positives). Line count is preserved so reported line numbers stay accurate.
// String-literal contents are left intact — the realistic hand-rolled read is a
// real call, not a string; the rare string-embedded read-call form is part of
// the undecidable residual (ED-222), not something we widen the net to chase.
function stripComments(src) {
  const out = [];
  let inBlock = false;
  for (const line of String(src).split("\n")) {
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) {
        out.push(""); // whole line inside a block comment
        continue;
      }
      // Resume after the block close on this line.
      out.push(" ".repeat(end + 2) + stripLine(line.slice(end + 2)));
      inBlock = false;
      continue;
    }
    const { text, opened } = stripLine(line, true);
    out.push(text);
    if (opened) inBlock = true;
  }
  return out.join("\n");
}

// Strip a single line's `//` line-comment and any COMPLETE `/* */` block; if an
// unterminated `/*` opens, report it so the caller enters block mode.
function stripLine(line, trackOpen) {
  let s = line;
  // Remove complete inline block comments first.
  s = s.replace(/\/\*[^]*?\*\//g, (m) => " ".repeat(m.length));
  let opened = false;
  const blockOpen = s.indexOf("/*");
  if (blockOpen !== -1) {
    // Unterminated block starts here — drop the rest of the line.
    s = s.slice(0, blockOpen);
    opened = true;
  } else {
    // Line comment (only when no open block took precedence).
    const lineComment = s.indexOf("//");
    if (lineComment !== -1) s = s.slice(0, lineComment);
  }
  return trackOpen ? { text: s, opened } : s;
}

// ── The read-call detector ───────────────────────────────────────────────────
// A read-call FORM whose argument references the events-file literal, matched
// line-scoped (`.` never crosses a newline) so `.*?` can pass through nested
// parens like `readJsonl(path.join(ROOT, paths.eventsFile))`. Read verbs cover
// the fs primitives plus the repo's `readJsonl`/`readLines` helpers. Events-file
// reference tokens: the bare filename, the `.eventsFile` path property, and the
// `EVENTS_FILE` constant.
const READ_VERBS = "readFileSync|readFile|createReadStream|readJsonl|readLines";
const EVENTS_TOKEN = "events\\.jsonl|\\.eventsFile\\b|\\bEVENTS_FILE\\b";
const READ_RE = new RegExp(
  "\\b(?:" + READ_VERBS + ")\\s*\\(.*?(?:" + EVENTS_TOKEN + ")",
);

/** Scan one file's (comment-stripped) content for direct events-log reads.
 *  Returns [{ line, snippet }] — empty when the file performs no such read. */
function findReads(content) {
  const hits = [];
  const stripped = stripComments(content);
  const lines = stripped.split("\n");
  const rawLines = String(content).split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (READ_RE.test(lines[i])) {
      hits.push({ line: i + 1, snippet: (rawLines[i] || "").trim().slice(0, 200) });
    }
  }
  return hits;
}

/**
 * Pure core: given `{ files: [{ path, content }] }` (POSIX repo-relative paths),
 * return the offenders — files NOT on the allowlist that perform a direct
 * events-log read. A file that could not be read is surfaced as `{unreadable:true}`
 * and is ALWAYS an offender (fail-closed — a scan gap must never read green).
 */
function evaluate(input) {
  const files = (input && input.files) || [];
  const offenders = [];
  for (const f of files) {
    const rel = f && f.path;
    if (typeof rel !== "string" || !rel) {
      offenders.push({ path: "(unknown)", reason: "malformed-file-record" });
      continue;
    }
    if (f.unreadable) {
      offenders.push({ path: rel, reason: "unreadable" });
      continue;
    }
    if (isSanctioned(rel)) continue; // sanctioned reader — allowed
    const hits = findReads(f.content == null ? "" : String(f.content));
    if (hits.length) offenders.push({ path: rel, reason: "unsanctioned-reader", hits });
  }
  return { ok: offenders.length === 0, offenders };
}

// ── fs-backed scan of scripts/** ─────────────────────────────────────────────
/** Recursively collect `*.js` files under `dirAbs`. Traverses dot-dirs; skips
 *  node_modules and .git. Throws only on a genuine fs fault (caller fails-closed). */
function collectJsFiles(dirAbs, acc) {
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dirAbs, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      collectJsFiles(full, acc);
    } else if (e.isFile() && e.name.endsWith(".js")) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Scan `<root>/scripts/**` for un-sanctioned direct events-log reads. Returns
 * the evaluate() shape plus `scanned` (files read). A per-file read fault is
 * carried into evaluate() as `unreadable` (fail-closed), NOT swallowed.
 */
function scan(root) {
  const rootAbs = root || process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
  const scriptsDir = path.join(rootAbs, "scripts");
  // BR-8 + SEC-5 (gauntlet R1): the scripts dir MUST exist, be a real directory,
  // and be physically CONTAINED in root (realpath). A missing / non-directory
  // scripts path (e.g. a wrong --root) is a RUNNER ERROR — throw so the CLI fails
  // closed (exit 2), NEVER a green `scanned:0`. A junctioned/symlinked scripts dir
  // resolving OUTSIDE root is refused so the scanner never traverses + reads
  // external files (SEC-5 verified junction escape).
  let realScripts;
  try {
    realScripts = fs.realpathSync(scriptsDir);
  } catch (e) {
    throw new Error(
      `scripts dir not found or inaccessible under root (${scriptsDir}) — cannot scan: ${e && e.message ? e.message : e}`,
    );
  }
  if (!fs.lstatSync(realScripts).isDirectory()) {
    throw new Error(`scripts path is not a directory: ${scriptsDir}`);
  }
  let realRoot;
  try {
    realRoot = fs.realpathSync(rootAbs);
  } catch (e) {
    throw new Error(`root inaccessible (${rootAbs}): ${e && e.message ? e.message : e}`);
  }
  const sep = realRoot.endsWith(path.sep) ? realRoot : realRoot + path.sep;
  if (realScripts !== realRoot && !realScripts.startsWith(sep)) {
    throw new Error(`scripts dir escapes root (realpath): ${scriptsDir} → ${realScripts}`);
  }
  const files = [];
  for (const abs of collectJsFiles(realScripts, [])) {
    const rel = path.relative(rootAbs, abs).replace(/\\/g, "/");
    let content = null;
    let unreadable = false;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      unreadable = true;
    }
    files.push({ path: rel, content, unreadable });
  }
  return { ...evaluate({ files }), scanned: files.length };
}

module.exports = { evaluate, findReads, isSanctioned, stripComments, scan, ALLOWLIST, SELF };

// ── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const argv = process.argv.slice(2);
  const JSON_OUT = argv.includes("--json");
  const ENFORCE = argv.includes("--enforce");
  const rootIdx = argv.indexOf("--root");
  const root = rootIdx !== -1 ? argv[rootIdx + 1] : undefined;

  let res;
  try {
    res = scan(root);
  } catch (e) {
    // fail-closed: a scanner that faults must NEVER read green.
    const msg = e && e.message ? e.message : e;
    if (JSON_OUT) console.log(JSON.stringify({ check: NAME, ok: false, error: String(msg) }));
    else console.error(`[${NAME}] runner error (fail-closed): ${msg}`);
    process.exit(2);
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ check: NAME, enforce: ENFORCE, ...res }));
  } else if (res.ok) {
    console.log(`OK   [${NAME}] ${res.scanned} scripts/ file(s) scanned; all direct events-log reads are sanctioned`);
  } else {
    const verb = ENFORCE ? "FAIL" : "REPORT";
    console.error(`${verb} [${NAME}] ${res.offenders.length} un-sanctioned direct events-log reader(s):`);
    for (const o of res.offenders) {
      if (o.hits && o.hits.length) {
        for (const h of o.hits) console.error(`  - ${o.path}:${h.line}  ${h.snippet}`);
      } else {
        console.error(`  - ${o.path}: ${o.reason}`);
      }
    }
    console.error(
      `[${NAME}] sanctioned readers: the CLOSED allowlist in this check + *.test.js. ` +
        `Route other reads through a materialized state file or 'events:query --archive' ` +
        `(doctrine: .claude/project/reference/reader-discipline.md). Undecidable residual → ED-222.`,
    );
    if (!ENFORCE) {
      console.error(`[${NAME}] report-only — re-run with --enforce to make this a blocking gate.`);
    }
  }
  process.exit(ENFORCE ? (res.ok ? 0 : 1) : 0);
}
