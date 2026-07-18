#!/usr/bin/env node
"use strict";

/**
 * contract-lint.js — G0.1: structural lint for the Top-Level Runtime Contract
 * (.claude/kernel/top-level-runtime-contract.md, D1 — SP-20260718-001 Phase 0).
 *
 * The contract is a SEQUENCE of numbered POLICY BLOCKS (`#### P<section>.<index>
 * — <title>`), each with a UNIQUE id. Every ORDINARY (non-CORE) policy block
 * must end with EXACTLY ONE machine-parseable trailer line:
 *   Enforcer: scripts/checks/<x>.js   — enforceable-now; ref MUST resolve.
 *   Deferred: ED-NNN @ Phase-X-exit   — enforced-later; ED MUST exist in the ledger.
 *   Core: non-waivable                — a CORE invariant (§7); the ED hatch is refused.
 * A CORE-tagged block (`**core_id:**` present, §7) carries a RICHER trailer
 * shape (R4-2, gauntlet round 4): exactly one `Core: non-waivable` trailer
 * PLUS one-or-more `Enforcer:` refs naming the check(s) that enforce its
 * substance NOW — `Core: non-waivable` alone (no enforcer named) is
 * aspirational, not itself a waiver, but not enforcement either.
 *
 * This lints STRUCTURALLY (heading/trailer regex parsing over the document),
 * never by prose-scraping.
 *
 * FAIL-CLOSED, three-way exit contract (mirrors log-sink-caps.js's shape, but
 * splits the non-zero case in two per R1/AC-4 — a structural/reference-integrity
 * failure must be DISTINCT from a content policy failure):
 *   0  clean — every block well-formed + resolving, no duplicate ids, CORE
 *      register complete + every CORE block names an enforcer, D8 sentence
 *      present, fixture count nonzero.
 *   1  policy-FAIL — the document PARSES fine (every block has a well-formed
 *      trailer shape, every reference resolves, no duplicates) but violates a
 *      CONTENT policy: a CORE-tagged block waived by a Deferred/ED instead of
 *      `Core: non-waivable` (core-waived), a CORE-tagged block correctly using
 *      `Core: non-waivable` but naming ZERO `Enforcer:` refs (core-unenforced,
 *      R4-2 — aspirational, a false-green in a BINDING P0 register), the CORE
 *      register incomplete, the fixture count zero, or the D8 sentence missing.
 *   2  fail-closed/structural — the input could not be TRUSTED at all: no
 *      policy blocks found, TWO POLICY BLOCKS SHARING THE SAME ID (R4-4,
 *      gauntlet round 4 — an ambiguous/contradictory contract), a block with
 *      an unrecognized trailer shape (zero trailers; 2+ trailers on a
 *      non-CORE block; a CORE-tagged block missing its `Core:`/`Deferred:`
 *      anchor or mixing `Core:`+`Deferred:` together), a block whose
 *      (last-recognized) trailer is not the LAST non-empty line of its block
 *      (S-1 — trailing content after the trailer is unparseable-as-terminal),
 *      an Enforcer ref that does not resolve (missing file, escapes
 *      scripts/checks/ — B-1, is not a `.js` FILE — a directory or non-.js
 *      requireable, R3-2 — or fails to load), a ledger file that could not
 *      be read/parsed, the D6 fixture manifest present-but-unreadable/
 *      unparseable/missing-count (C-1 — distinct from a manifest that reads
 *      fine with a legitimately-zero count, which is policy §1), the
 *      declared "### Policy-block register" (§7) disagreeing with the blocks
 *      actually parsed — a registered id with no matching block, a parsed
 *      block absent from the register, TWO REGISTER ROWS FOR THE SAME ID
 *      (R4-4), or a numbering gap within a section (R3-4 — catches a policy
 *      block silently REMOVED from the document; a TRAILING removal — the
 *      section's own LAST block AND its LAST register row deleted together —
 *      is a known residual this check does not catch, see ED-219), or any
 *      `ED-NNN` cited anywhere in the document that is absent from the ledger.
 * A malformed/unparseable input NEVER reads clean (0) — this is the bootstrap
 * trust root; a green-pass-on-unparseable is the false-green class this whole
 * Phase-0 build exists to kill.
 *
 * Self-hosts: linting the real contract (the default doc path) must exit 0.
 *
 *   node scripts/checks/contract-lint.js [--json] [<path-to-contract.md>]
 */

const fs = require("fs");
const path = require("path");

/**
 * ROOT resolution anchors on __dirname FIRST (this script's own location is
 * always inside the correct checkout — worktree or canonical), falling back
 * to CLAUDE_PROJECT_DIR only when the anchor-derived root doesn't look like a
 * real checkout. This mirrors the ED-016 fix precedent (dispatch-agent.js's
 * `AGENT_ROOT = __dirname/..` anchor): a session's CLAUDE_PROJECT_DIR can be
 * STALE (pointing at a different worktree/canonical than the one this script
 * physically lives in — the "stale-worktree cwd hazard" class), which would
 * make contract-lint fail its own self-host inside an isolated build
 * worktree. Trusting the anchor over a possibly-stale env var keeps the
 * self-host deterministic regardless of which checkout invoked it from.
 */
function resolveRoot() {
  const anchor = path.resolve(__dirname, "..", "..");
  if (fs.existsSync(path.join(anchor, ".claude"))) return anchor;
  const envRoot = process.env.CLAUDE_PROJECT_DIR;
  if (envRoot && fs.existsSync(path.join(envRoot, ".claude"))) return envRoot;
  return anchor;
}

const ROOT = resolveRoot();
const NAME = "contract-lint";

const DEFAULT_DOC = path.join(ROOT, ".claude", "kernel", "top-level-runtime-contract.md");
const DEFAULT_LEDGER = path.join(ROOT, ".claude", "project", "memory", "enforcement-debt.jsonl");
const DEFAULT_MANIFEST = path.join(ROOT, ".claude", "kernel", "fixtures", "manifest.json");

// The H-1 / D8 Definition-of-Done sentence, byte-exact (verified against
// SP-20260718-001/prd.md at authoring time — never retype this by hand again;
// copy it forward if the sentence ever needs to move).
const H1_SENTENCE =
  "1.0 is done when a clean installed product moves idea→canon→roadmap→sprint→build→gauntlet→launch-readiness→release→retro→learning-promotion without relying on chat memory, stale trackers, manual Alpha heroics, or unverified agent claims.";

// N-1 [gauntlet round 2]: a policy-block heading is well-formed ONLY when it
// carries the FULL shape — the em-dash delimiter (U+2014, ` — `) AND a
// non-empty title after it. `#### P1.1` alone (no delimiter/title) is NOT a
// valid heading — see HEADING_ATTEMPT_RE below for how that case is caught
// as a distinct structural failure rather than silently accepted or silently
// swallowed as trailing prose of whatever block happens to be open.
const HEADING_RE = /^####\s+P(\d+)\.(\d+)\s+—\s+(\S.*)$/;
// Loose "attempt" pattern — ANY line that opens a `#### P<n>.<m>` heading,
// well-formed or not. Used to detect a heading that OPENS a policy block
// (matches the numbering shape) but fails HEADING_RE's full-shape
// requirement (missing delimiter and/or title) — that line must never be
// silently accepted as valid, and must never be silently absorbed as body
// content of a DIFFERENT (previous or next) block either.
const HEADING_ATTEMPT_RE = /^####\s+P(\d+)\.(\d+)\b/;
// A "## " OR "### " heading boundary closes any open block (#### is unaffected
// — it OPENS a new block via HEADING_RE, checked first). Widened from "## "-only
// (S-1 fix): a "### " subsection appendix (e.g. "### Policy-block register")
// immediately after a block's trailer must NOT be silently absorbed into that
// block's own lines — the real contract's own P7.5 block was exactly this case
// before the fix (its Enforcer trailer was followed by the whole appendix table).
const SECTION_RE = /^#{2,3}\s+/;
// A markdown thematic break ("---", "***", "___", 3+ repeated, optional
// trailing whitespace) is ALSO a block-closing boundary (S-1 fix, second half):
// this contract uses "---" between every §-section as a visual separator
// AFTER each block's trailer — without this, that separator line reads as
// "trailing content" and every well-formed block would spuriously trip
// trailer-not-terminal. A thematic break is a definitive document boundary,
// never legitimate policy-block content.
const THEMATIC_BREAK_RE = /^(-{3,}|\*{3,}|_{3,})\s*$/;
const ENFORCER_RE = /^Enforcer:\s*(.+)$/;
const DEFERRED_RE = /^Deferred:\s*(ED-\d+)\s*@\s*(Phase-\d+-exit)$/;
const CORE_RE = /^Core:\s*non-waivable$/;
const CORE_ID_RE = /\*\*core_id:\*\*\s*(CORE-\d+)/;
const WAIVABLE_FALSE_RE = /\*\*waivable:\*\*\s*false/;
const ED_TOKEN_RE = /ED-\d+/g;
const REQUIRED_CORE_IDS = ["CORE-1", "CORE-2", "CORE-3", "CORE-4"];

/** Parse ledger JSONL text into a Set of known ED ids. THROWS on any unparseable line (fail-closed). */
function parseLedgerIds(text) {
  const ids = new Set();
  const lines = text.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      const err = new Error(`ledger line is not valid JSON: ${line.slice(0, 80)}`);
      err.code = "LEDGER_PARSE_ERROR";
      throw err;
    }
    if (obj && typeof obj.id === "string") ids.add(obj.id);
  }
  return ids;
}

/**
 * Split doc lines into policy blocks: [{ id, headingLine, lines:[...] }]. Zero
 * blocks = malformed input. The returned array also carries a
 * `.malformedHeadings` property (N-1): [{ line, text, attemptedId }] for any
 * line that OPENS a `#### P<n>.<m>` heading attempt but does not match the
 * full well-formed HEADING_RE shape (delimiter + non-empty title).
 */
function findBlocks(lines) {
  const blocks = [];
  const malformedHeadings = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = HEADING_RE.exec(line);
    if (h) {
      if (current) blocks.push(current);
      current = { id: `P${h[1]}.${h[2]}`, headingLine: i, lines: [line] };
      continue;
    }
    // N-1: a line that OPENS a policy-block heading (matches the loose
    // `#### P<n>.<m>` numbering shape) but fails the strict HEADING_RE
    // (missing the ` — ` delimiter and/or a non-empty title) must NEVER be
    // silently accepted, and must NEVER be silently absorbed as trailing
    // body content of whatever block happens to be open — both of those
    // were the round-1 gap. Record it explicitly and treat it as a block
    // boundary (same as a well-formed heading would be), so it neither opens
    // a bogus block nor gets swallowed into an unrelated one.
    const attempt = HEADING_ATTEMPT_RE.exec(line);
    if (attempt) {
      malformedHeadings.push({ line: i + 1, text: line, attemptedId: `P${attempt[1]}.${attempt[2]}` });
      if (current) blocks.push(current);
      current = null;
      continue;
    }
    if (current) {
      if (SECTION_RE.test(line) || THEMATIC_BREAK_RE.test(line.trim())) {
        blocks.push(current);
        current = null;
        continue;
      }
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);
  blocks.malformedHeadings = malformedHeadings;
  return blocks;
}

// R3-4 [HIGH, gauntlet round 3]: the "### Policy-block register" appendix
// table (§7) — when a document declares one, it becomes the single source of
// truth for "which policy blocks must exist," closing the gap where a
// critical policy block that is silently REMOVED (heading + trailer both
// deleted) was previously invisible: findBlocks()/evaluate() only ever
// inspect blocks they FIND, so a document with fewer blocks than it should
// have read exactly as clean as one that never had the extra block. See
// parsePolicyRegister() below + its call site in evaluate() for the
// completeness checks this enables.
const REGISTER_HEADING_RE = /^###\s+Policy-block register\s*$/;
const REGISTER_ROW_RE = /^\|\s*(P(\d+)\.(\d+))\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/;

/**
 * Parse the "### Policy-block register" markdown table, if the document
 * declares one. Returns { found: false, rows: [] } when no such heading
 * exists anywhere in the document — register-completeness is OPT-IN per
 * document: most narrow structural/policy pure-core test snippets deliberately
 * don't declare a register (they're testing one orthogonal parsing rule in
 * isolation), and requiring one universally would turn every such snippet
 * into a spurious register-completeness failure unrelated to what it's
 * actually testing. The REAL contract (top-level-runtime-contract.md) DOES
 * declare one (§7), so this check is fully active for the document that
 * matters — the one G0.1 self-hosts.
 */
function parsePolicyRegister(lines) {
  const headingIdx = lines.findIndex((l) => REGISTER_HEADING_RE.test(l.trim()));
  if (headingIdx === -1) return { found: false, rows: [] };
  const rows = [];
  let sawTableRow = false;
  for (let i = headingIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed.startsWith("|")) {
      if (sawTableRow) break; // the table has ended
      if (trimmed === "") continue; // blank line(s) between the heading and the table are fine
      break; // some other content before any table row appeared -- no table here
    }
    sawTableRow = true;
    const m = REGISTER_ROW_RE.exec(trimmed);
    // Header ("| Block | Section | Trailer |") and separator ("|---|---|---|")
    // rows never match REGISTER_ROW_RE's P<n>.<m> id shape — skipped naturally.
    if (m) {
      rows.push({ id: m[1], section: Number(m[2]), index: Number(m[3]), line: i + 1 });
    }
  }
  return { found: true, rows };
}

/**
 * Resolve + attempt to load an Enforcer script ref (fail-CLOSED: existence AND
 * loadability, per R2 — "ref MUST resolve to an existing script"). Scripts
 * under scripts/checks/ are written `if (require.main === module)`-guarded
 * (log-sink-caps.js style), so `require()`-ing them here executes only their
 * top-level module body, never their CLI side effects.
 *
 * B-1 SECURITY: path-containment is enforced BEFORE any require() call
 * (mirrors scripts/hooks/lib/retention.js#safeResolve). An `Enforcer:`
 * trailer is document-authored text — trusting it enough to `require()`
 * without first proving the resolved path stays INSIDE scripts/checks/ would
 * let a doc author (or a poisoned/traversal `../` ref) achieve arbitrary code
 * execution during a routine lint. A ref that escapes scripts/checks/ is
 * UNRESOLVABLE by definition and is NEVER passed to require() — not even to
 * check if it "would" load.
 */
function resolveEnforcer(ref, rootDir) {
  const trimmed = String(ref || "").trim();
  if (!trimmed) return { resolved: false, error: "empty enforcer ref" };
  const abs = path.isAbsolute(trimmed) ? trimmed : path.join(rootDir, trimmed);

  const checksRoot = path.resolve(rootDir, "scripts", "checks");
  const checksRootWithSep = checksRoot.endsWith(path.sep) ? checksRoot : checksRoot + path.sep;
  const resolvedAbs = path.resolve(abs);
  if (resolvedAbs !== checksRoot && !resolvedAbs.startsWith(checksRootWithSep)) {
    return {
      resolved: false,
      error: `enforcer ref escapes scripts/checks/ (refused before require(), never loaded): ${trimmed}`,
    };
  }

  if (!fs.existsSync(resolvedAbs)) return { resolved: false, error: `does not exist: ${trimmed}` };

  // R3-2 [HIGH, gauntlet round 3]: the containment guard above only proves the
  // resolved path stays INSIDE scripts/checks/ — it says nothing about WHAT
  // that path is. Node's `require()` happily resolves a DIRECTORY (via its
  // index.js) and happily resolves a non-`.js` requireable file (e.g. a
  // `.json` module) — either of those would let an `Enforcer:` trailer point
  // at something other than the single, individually-audited `.js` script the
  // contract's own convention (`Enforcer: scripts/checks/<x>.js`) promises. A
  // ref that is not BOTH (a) `.js`-suffixed AND (b) a regular file (never a
  // directory, symlink-to-directory included — fs.statSync follows symlinks)
  // is unresolvable by definition and is NEVER passed to require() — same
  // fail-closed posture as the path-containment guard above.
  if (!resolvedAbs.toLowerCase().endsWith(".js")) {
    return {
      resolved: false,
      error: `enforcer ref does not resolve to a .js file (refused before require(), never loaded): ${trimmed}`,
    };
  }
  let stat;
  try {
    stat = fs.statSync(resolvedAbs);
  } catch (e) {
    return { resolved: false, error: `failed to stat: ${(e && e.message) || e}` };
  }
  if (!stat.isFile()) {
    return {
      resolved: false,
      error: `enforcer ref does not resolve to a regular file (refused before require(), never loaded): ${trimmed}`,
    };
  }

  // Symlink-escape guard: if the ref exists, its REAL (symlink-resolved)
  // target must also stay inside scripts/checks/ — a symlink planted inside
  // scripts/checks/ whose target points elsewhere must never be honored.
  try {
    const real = fs.realpathSync(resolvedAbs);
    if (real !== checksRoot && !real.startsWith(checksRootWithSep)) {
      return {
        resolved: false,
        error: `enforcer ref is a symlink escaping scripts/checks/ (refused before require(), never loaded): ${trimmed}`,
      };
    }
  } catch {
    /* existsSync above already proved it resolves; a realpath race here is not a new risk */
  }

  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(resolvedAbs);
    return { resolved: true };
  } catch (e) {
    return { resolved: false, error: `failed to load: ${(e && e.message) || e}` };
  }
}

/**
 * Pure core. `opts`:
 *   docText      (string) the contract document text (or a fixture doc under test)
 *   ledgerIds    (Set<string>|null) known ED ids; null signals the ledger could not be read/parsed
 *   ledgerError  (string, optional) set when the ledger read/parse failed
 *   fixtureCount (number|undefined) D6 manifest's `count` field; undefined when unset/unreadable
 *   manifestError (string, optional) set when the D6 manifest read/parse/shape failed (C-1) —
 *     DISTINCT from a manifest that read fine with a legitimately-zero count (that stays policy)
 *   rootDir      (string) used to resolve Enforcer refs
 *   resolveEnforcerFn (function, optional) injectable for tests
 * Returns { ok, exitCode, structural:[...], policy:[...] }.
 */
function evaluate(opts) {
  const { docText, ledgerIds, ledgerError, fixtureCount, manifestError, rootDir, resolveEnforcerFn } = opts || {};
  const doResolve = resolveEnforcerFn || ((ref) => resolveEnforcer(ref, rootDir));

  const structural = [];
  const policy = [];

  if (ledgerError) {
    structural.push({ reason: "ledger-unreadable", detail: ledgerError });
  }

  // C-1: a D6 manifest that exists but could not be read/parsed/shape-validated
  // is CORRUPT, not "legitimately zero" — mirror the ledger-unreadable path
  // (structural, exit 2), never silently routed to the fixture-count-zero
  // POLICY case (exit 1).
  if (manifestError) {
    structural.push({ reason: "manifest-unreadable", detail: manifestError });
  }

  if (typeof docText !== "string" || !docText.trim()) {
    structural.push({ reason: "empty-document" });
    return finalize(structural, policy);
  }

  const lines = docText.split("\n");
  const blocks = findBlocks(lines);
  const malformedHeadings = blocks.malformedHeadings || [];

  // N-1: any malformed heading attempt is ALWAYS a structural failure —
  // pushed regardless of whether any well-formed blocks also exist elsewhere
  // in the document (a document can be partially well-formed and still be
  // untrustworthy as a whole).
  for (const mh of malformedHeadings) {
    structural.push({
      reason: "malformed-heading",
      line: mh.line,
      attemptedId: mh.attemptedId,
      detail: mh.text.trim(),
    });
  }

  if (blocks.length === 0) {
    // Only push the generic "no-policy-blocks" reason when there wasn't
    // even a malformed heading ATTEMPT — a malformed-heading-only document
    // already has a more specific structural reason recorded above, and
    // "no-policy-blocks" would be a misleading duplicate (it implies no
    // heading was ever attempted at all).
    if (malformedHeadings.length === 0) {
      structural.push({ reason: "no-policy-blocks" });
    }
    return finalize(structural, policy);
  }

  // R4-4 [HIGH, gauntlet round 4]: reject DUPLICATE policy-block ids. The
  // pre-fix R3-4 register check caught missing/orphaned/gap ids but never a
  // RE-SEEN id — two separate '#### P<n>.<m>' headings sharing the same id
  // made an ambiguous/contradictory contract that read exactly as clean as a
  // document where every id appears once, as long as each individual block
  // was itself well-formed. A repeated id is a structural fail (exit 2),
  // never a silent duplicate pass.
  const blockIdCounts = new Map();
  for (const block of blocks) {
    blockIdCounts.set(block.id, (blockIdCounts.get(block.id) || 0) + 1);
  }
  for (const [id, count] of blockIdCounts.entries()) {
    if (count > 1) {
      structural.push({ reason: "duplicate-block-id", block: id, count });
    }
  }

  const coreBlocks = new Map(); // core_id -> [{ block, trailerKind, hasEnforcer, waivableFalse }, ...] (N-6: ALL declarations, not just the last)

  for (const block of blocks) {
    const blockText = block.lines.join("\n");
    // core_id tagging is computed BEFORE trailer-shape validation (R4-2) --
    // a core_id-tagged block is now VALIDATED against a different trailer
    // shape than an ordinary block (see below).
    const coreMatch = CORE_ID_RE.exec(blockText);
    const isCoreTagged = !!coreMatch;

    const trailerMatches = [];
    for (let li = 0; li < block.lines.length; li++) {
      const trimmed = block.lines[li].trim();
      if (ENFORCER_RE.test(trimmed)) trailerMatches.push({ kind: "Enforcer", line: trimmed, idx: li });
      else if (DEFERRED_RE.test(trimmed)) trailerMatches.push({ kind: "Deferred", line: trimmed, idx: li });
      else if (CORE_RE.test(trimmed)) trailerMatches.push({ kind: "Core", line: trimmed, idx: li });
    }
    const coreTrailers = trailerMatches.filter((t) => t.kind === "Core");
    const enforcerTrailers = trailerMatches.filter((t) => t.kind === "Enforcer");
    const deferredTrailers = trailerMatches.filter((t) => t.kind === "Deferred");

    // R4-2 [HIGH, gauntlet round 4]: a core_id-tagged block's valid trailer
    // SHAPE is now one of two forms:
    //   (a) exactly one `Core: non-waivable` trailer PLUS one-or-more
    //       `Enforcer:` refs naming its enforced-NOW check(s) — the shape
    //       this fix REQUIRES going forward. Whether an Enforcer is actually
    //       PRESENT is a CONTENT/policy question (see "core-unenforced"
    //       below, mirrors core-incomplete/core-waived being policy, not
    //       structural) — an Enforcer-less `Core:` block is still
    //       STRUCTURALLY well-formed, just POLICY-incomplete (aspirational).
    //   (b) exactly one `Deferred:` trailer and nothing else — the
    //       pre-existing AC-5 "core-waived-by-ED" shape, still structurally
    //       fine, POLICY-flagged as core-waived below.
    // ANY other combination on a core_id-tagged block (zero trailers, 2+
    // `Core:` lines, `Core:` + `Deferred:` together, `Deferred:` +
    // `Enforcer:` together, an `Enforcer:`-only block with no `Core:`/
    // `Deferred:` at all) is NOT a recognized shape and fails structural —
    // same fail-closed posture as before.
    //
    // A block that is NOT core_id-tagged is COMPLETELY UNCHANGED: it still
    // requires EXACTLY ONE trailer of any kind. This is what
    // malformed-heading.md / trailer-not-terminal.md's incidental
    // "Core: non-waivable" trailers on non-core_id blocks continue to
    // exercise, unaffected by this fix.
    let shapeOk = false;
    let terminalIdx = -1;
    let recognized = []; // the trailer(s) counted toward this block's shape, in document order

    if (isCoreTagged && coreTrailers.length === 1 && deferredTrailers.length === 0) {
      shapeOk = true;
      recognized = [...coreTrailers, ...enforcerTrailers].sort((a, b) => a.idx - b.idx);
      terminalIdx = recognized[recognized.length - 1].idx;
    } else if (
      isCoreTagged &&
      deferredTrailers.length === 1 &&
      coreTrailers.length === 0 &&
      enforcerTrailers.length === 0
    ) {
      shapeOk = true;
      recognized = deferredTrailers;
      terminalIdx = deferredTrailers[0].idx;
    } else if (!isCoreTagged && trailerMatches.length === 1) {
      shapeOk = true;
      recognized = trailerMatches;
      terminalIdx = trailerMatches[0].idx;
    }

    if (!shapeOk) {
      structural.push({ reason: "malformed-block-trailer", block: block.id, found: trailerMatches.length });
      continue;
    }

    // S-1: the recognized trailer(s) must end at the LAST non-empty line of
    // the block — content after the LAST recognized trailer line is malformed
    // (the block cannot be trusted to have "ended" at its trailer(s)).
    const hasTrailingContent = block.lines.slice(terminalIdx + 1).some((l) => l.trim().length > 0);
    if (hasTrailingContent) {
      structural.push({ reason: "trailer-not-terminal", block: block.id });
      continue;
    }

    for (const t of recognized) {
      if (t.kind === "Enforcer") {
        const m = ENFORCER_RE.exec(t.line);
        const res = doResolve(m[1]);
        if (!res.resolved) {
          structural.push({ reason: "unresolvable-enforcer", block: block.id, detail: res.error });
        }
      } else if (t.kind === "Deferred") {
        const m = DEFERRED_RE.exec(t.line);
        const edId = m[1];
        if (!ledgerIds || !ledgerIds.has(edId)) {
          structural.push({ reason: "missing-ed", block: block.id, ed: edId });
        }
      }
    }

    // core_id tagging is INDEPENDENT of which trailer kind matched — a block
    // can be tagged core_id/waivable:false with the WRONG trailer (Deferred
    // instead of Core); that mismatch is the core-waived-by-ed case (AC-5),
    // a CONTENT/policy violation on an otherwise well-formed block.
    // N-6 [gauntlet round 2]: record EVERY declaration of a core_id, not
    // just the most recent — a Map.set() here used to OVERWRITE an earlier
    // (waived) declaration with a later (correct) one, hiding the waiver.
    // CORE ids are non-waivable EVERYWHERE they appear, so every
    // declaration must be checked independently.
    if (isCoreTagged) {
      const coreId = coreMatch[1];
      const entries = coreBlocks.get(coreId) || [];
      entries.push({
        block: block.id,
        trailerKind: coreTrailers.length === 1 ? "Core" : deferredTrailers.length === 1 ? "Deferred" : "Enforcer",
        // R4-2: recorded so the CORE completeness loop below can flag a
        // correctly-`Core:`-tagged (not waived) block that names ZERO
        // `Enforcer:` refs — an aspirational non-waivable invariant with
        // nothing enforcing its substance.
        hasEnforcer: enforcerTrailers.length >= 1,
        waivableFalse: WAIVABLE_FALSE_RE.test(blockText),
      });
      coreBlocks.set(coreId, entries);
    }
  }

  // R3-4: §7 policy-block REGISTER completeness. When the document declares a
  // "### Policy-block register" table, it is the single source of truth for
  // "which policy blocks must exist" — cross-check it against the blocks this
  // parse ACTUALLY found:
  //   - a registered id with no matching parsed block -> the block was
  //     silently removed but its register row survived (structural).
  //   - a parsed block absent from the register -> register drift, the
  //     register no longer accounts for a real block (structural).
  //   - a numbering GAP within a section's register rows -> catches the case
  //     where BOTH a block's heading AND its register row were removed
  //     together (so neither of the two checks above fires on their own) —
  //     a hole in the P<n>.<m> sequence still gives it away (structural).
  // A document that never declares the register is unaffected (see
  // parsePolicyRegister()'s doc comment).
  const registerResult = parsePolicyRegister(lines);
  if (registerResult.found) {
    const registerIds = new Set(registerResult.rows.map((r) => r.id));
    const actualIds = new Set(blocks.map((b) => b.id));

    for (const row of registerResult.rows) {
      if (!actualIds.has(row.id)) {
        structural.push({
          reason: "register-block-missing",
          block: row.id,
          detail: `${row.id} is enumerated in the §7 policy-block register but no matching '#### ${row.id} — ...' heading exists in the document`,
        });
      }
    }
    for (const block of blocks) {
      if (!registerIds.has(block.id)) {
        structural.push({
          reason: "register-drift",
          block: block.id,
          detail: `${block.id} exists in the document but is not enumerated in the §7 policy-block register`,
        });
      }
    }

    // R4-4 [HIGH, gauntlet round 4]: reject DUPLICATE register rows — two rows
    // for the SAME id let an ambiguous/contradictory contract read clean as
    // long as the id resolves to a matching block at all (register-block-missing/
    // register-drift only ever check SET membership, so a re-seen id in the
    // table itself was previously invisible to both).
    const registerRowCounts = new Map();
    for (const row of registerResult.rows) {
      registerRowCounts.set(row.id, (registerRowCounts.get(row.id) || 0) + 1);
    }
    for (const [id, count] of registerRowCounts.entries()) {
      if (count > 1) {
        structural.push({
          reason: "duplicate-register-row",
          block: id,
          count,
          detail: `${id} is listed ${count} times in the §7 policy-block register — an ambiguous/contradictory register entry`,
        });
      }
    }

    const bySection = new Map();
    for (const row of registerResult.rows) {
      const arr = bySection.get(row.section) || [];
      arr.push(row.index);
      bySection.set(row.section, arr);
    }
    for (const [section, indices] of bySection.entries()) {
      const sorted = [...new Set(indices)].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length; i++) {
        const expected = i + 1;
        if (sorted[i] !== expected) {
          structural.push({
            reason: "register-gap",
            section: `§${section}`,
            expected: `P${section}.${expected}`,
            detail: `the §7 register has a numbering gap at P${section}.${expected} (next present entry is P${section}.${sorted[i]}) — a removed policy block leaves a hole in the sequence even when both its heading and its register row are deleted together`,
          });
          break;
        }
      }
    }
  }

  // Whole-document ED citation scan — catches EDs cited in prose/tables/JSON
  // evidence_refs too, not only inside a Deferred trailer line.
  if (ledgerIds) {
    const cited = new Set(docText.match(ED_TOKEN_RE) || []);
    for (const edId of cited) {
      if (!ledgerIds.has(edId)) structural.push({ reason: "missing-ed", block: null, ed: edId });
    }
  }

  // CORE register completeness + non-waivability — CONTENT policy, not structural:
  // the document parses fine; a CORE invariant is either absent from the
  // register or has been given an ED escape hatch instead of `Core: non-waivable`.
  for (const coreId of REQUIRED_CORE_IDS) {
    const entries = coreBlocks.get(coreId);
    if (!entries || entries.length === 0) {
      policy.push({ reason: "core-incomplete", core: coreId });
      continue;
    }
    // N-6: scan ALL declarations — ANY waived/Deferred instance of a CORE id
    // is a policy FAIL, even when the SAME core_id also appears elsewhere
    // with a correct `Core: non-waivable` trailer. A CORE invariant is
    // non-waivable everywhere it is declared, not just in its "best" block.
    for (const entry of entries) {
      if (!entry.waivableFalse || entry.trailerKind !== "Core") {
        policy.push({ reason: "core-waived", core: coreId, block: entry.block, trailerKind: entry.trailerKind });
      } else if (!entry.hasEnforcer) {
        // R4-2 [HIGH, gauntlet round 4]: a CORE block correctly using
        // `Core: non-waivable` (i.e. NOT waived — the branch above already
        // handles the wrong-trailer-kind case) but naming ZERO `Enforcer:`
        // refs is an ASPIRATIONAL non-waivable invariant with nothing named
        // that enforces its SUBSTANCE — a false-green in a BINDING P0
        // register (β's policy-hygiene refinement: `Core: non-waivable`
        // alone is not itself a waiver, but it is not enforcement either).
        // Distinct from core-waived (flags the WRONG trailer kind); this
        // flags the RIGHT trailer kind with nothing enforcing it.
        policy.push({ reason: "core-unenforced", core: coreId, block: entry.block });
      }
    }
  }

  // C-1: only reachable when the manifest read/parsed/shape-validated fine —
  // a manifestError already routed to the structural "manifest-unreadable"
  // case above and must not ALSO masquerade as a legitimate zero count here.
  if (!manifestError && !(fixtureCount > 0)) {
    policy.push({ reason: "fixture-count-zero", fixtureCount: fixtureCount || 0 });
  }

  if (!docText.includes(H1_SENTENCE)) {
    policy.push({ reason: "dod-sentence-missing" });
  }

  return finalize(structural, policy);
}

function finalize(structural, policy) {
  let exitCode = 0;
  if (structural.length > 0) exitCode = 2;
  else if (policy.length > 0) exitCode = 1;
  return { ok: exitCode === 0, exitCode, structural, policy };
}

/** fs-backed runner. */
function run(opts) {
  opts = opts || {};
  const docPath = opts.docPath || DEFAULT_DOC;
  const ledgerPath = opts.ledgerPath || DEFAULT_LEDGER;
  const manifestPath = opts.manifestPath || DEFAULT_MANIFEST;
  const rootDir = opts.rootDir || ROOT;

  let docText = "";
  try {
    docText = fs.readFileSync(docPath, "utf8");
  } catch {
    docText = ""; // evaluate() treats this as empty-document (structural, exit 2)
  }

  let ledgerIds = null;
  let ledgerError = null;
  try {
    ledgerIds = parseLedgerIds(fs.readFileSync(ledgerPath, "utf8"));
  } catch (e) {
    ledgerError = (e && e.message) || String(e);
  }

  // C-1: distinguish a manifest READ/PARSE/SHAPE failure (corrupt — structural,
  // exit 2) from a manifest that reads fine with a legitimately-zero count
  // (policy, exit 1). Any fs.readFileSync throw (missing/unreadable), any
  // JSON.parse throw (malformed), or a missing/non-numeric `count` field all
  // count as "corrupt" — the runner cannot decide a real fixture count from
  // any of those, so none of them may fall through to fixture-count-zero.
  let fixtureCount;
  let manifestError = null;
  try {
    let raw;
    try {
      raw = fs.readFileSync(manifestPath, "utf8");
    } catch (e) {
      const err = new Error(`manifest unreadable: ${(e && e.message) || e}`);
      err.code = "MANIFEST_READ_ERROR";
      throw err;
    }
    let manifest;
    try {
      manifest = JSON.parse(raw);
    } catch (e) {
      const err = new Error(`manifest is not valid JSON: ${(e && e.message) || e}`);
      err.code = "MANIFEST_PARSE_ERROR";
      throw err;
    }
    if (!manifest || typeof manifest !== "object" || typeof manifest.count !== "number") {
      const err = new Error(`manifest missing/invalid 'count' field`);
      err.code = "MANIFEST_SHAPE_ERROR";
      throw err;
    }
    fixtureCount = manifest.count;
  } catch (e) {
    fixtureCount = undefined;
    manifestError = (e && e.message) || String(e);
  }

  return evaluate({ docText, ledgerIds, ledgerError, fixtureCount, manifestError, rootDir });
}

module.exports = { evaluate, run, findBlocks, resolveEnforcer, parseLedgerIds, parsePolicyRegister, H1_SENTENCE };

if (require.main === module) {
  const JSON_OUT = process.argv.includes("--json");
  const argPath = process.argv.slice(2).find((a) => !a.startsWith("--"));
  let res;
  try {
    res = run(argPath ? { docPath: path.resolve(argPath) } : {});
  } catch (e) {
    const msg = (e && e.message) || e;
    if (JSON_OUT) console.log(JSON.stringify({ ok: false, error: String(msg) }));
    else console.error(`[${NAME}] runner error (fail-closed): ${msg}`);
    process.exit(2);
  }
  if (JSON_OUT) {
    console.log(JSON.stringify({ check: NAME, ...res }));
  } else if (res.ok) {
    console.log(`OK   [${NAME}] contract lints clean (0 structural, 0 policy issues)`);
  } else {
    const verb = res.exitCode === 2 ? "FAIL-CLOSED" : "FAIL";
    console.error(
      `${verb} [${NAME}] ${res.structural.length} structural, ${res.policy.length} policy issue(s):`,
    );
    for (const s of res.structural) console.error(`  - [structural] ${JSON.stringify(s)}`);
    for (const p of res.policy) console.error(`  - [policy] ${JSON.stringify(p)}`);
  }
  process.exit(res.exitCode);
}
