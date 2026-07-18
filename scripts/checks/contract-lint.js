#!/usr/bin/env node
"use strict";

/**
 * contract-lint.js — G0.1: structural lint for the Top-Level Runtime Contract
 * (.claude/kernel/top-level-runtime-contract.md, D1 — SP-20260718-001 Phase 0).
 *
 * The contract is a SEQUENCE of numbered POLICY BLOCKS (`#### P<section>.<index>
 * — <title>`). Every policy block must end with EXACTLY ONE machine-parseable
 * trailer line:
 *   Enforcer: scripts/checks/<x>.js   — enforceable-now; ref MUST resolve.
 *   Deferred: ED-NNN @ Phase-X-exit   — enforced-later; ED MUST exist in the ledger.
 *   Core: non-waivable                — a CORE invariant (§7); the ED hatch is refused.
 *
 * This lints STRUCTURALLY (heading/trailer regex parsing over the document),
 * never by prose-scraping.
 *
 * FAIL-CLOSED, three-way exit contract (mirrors log-sink-caps.js's shape, but
 * splits the non-zero case in two per R1/AC-4 — a structural/reference-integrity
 * failure must be DISTINCT from a content policy failure):
 *   0  clean — every block well-formed + resolving, CORE register complete,
 *      D8 sentence present, fixture count nonzero.
 *   1  policy-FAIL — the document PARSES fine (every block has exactly one
 *      well-formed trailer, every reference resolves) but violates a CONTENT
 *      policy: a CORE-tagged block waived by a Deferred/ED instead of
 *      `Core: non-waivable`, the CORE register incomplete, the fixture count
 *      zero, or the D8 sentence missing.
 *   2  fail-closed/structural — the input could not be TRUSTED at all: no
 *      policy blocks found, a block with zero or 2+ trailer lines, an
 *      Enforcer ref that does not resolve (missing file or fails to load),
 *      a ledger file that could not be read/parsed, or any `ED-NNN` cited
 *      anywhere in the document that is absent from the ledger.
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

const HEADING_RE = /^####\s+P(\d+)\.(\d+)\b/;
const SECTION_RE = /^##\s+/; // a "## " section boundary closes any open block (#### is unaffected)
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

/** Split doc lines into policy blocks: [{ id, headingLine, lines:[...] }]. Zero blocks = malformed input. */
function findBlocks(lines) {
  const blocks = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const h = HEADING_RE.exec(line);
    if (h) {
      if (current) blocks.push(current);
      current = { id: `P${h[1]}.${h[2]}`, headingLine: i, lines: [line] };
      continue;
    }
    if (current) {
      if (SECTION_RE.test(line)) {
        blocks.push(current);
        current = null;
        continue;
      }
      current.lines.push(line);
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

/**
 * Resolve + attempt to load an Enforcer script ref (fail-CLOSED: existence AND
 * loadability, per R2 — "ref MUST resolve to an existing script"). Scripts
 * under scripts/checks/ are written `if (require.main === module)`-guarded
 * (log-sink-caps.js style), so `require()`-ing them here executes only their
 * top-level module body, never their CLI side effects.
 */
function resolveEnforcer(ref, rootDir) {
  const trimmed = String(ref || "").trim();
  if (!trimmed) return { resolved: false, error: "empty enforcer ref" };
  const abs = path.isAbsolute(trimmed) ? trimmed : path.join(rootDir, trimmed);
  if (!fs.existsSync(abs)) return { resolved: false, error: `does not exist: ${trimmed}` };
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(abs);
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
 *   fixtureCount (number|undefined) D6 manifest's `count` field; undefined = manifest missing/unreadable
 *   rootDir      (string) used to resolve Enforcer refs
 *   resolveEnforcerFn (function, optional) injectable for tests
 * Returns { ok, exitCode, structural:[...], policy:[...] }.
 */
function evaluate(opts) {
  const { docText, ledgerIds, ledgerError, fixtureCount, rootDir, resolveEnforcerFn } = opts || {};
  const doResolve = resolveEnforcerFn || ((ref) => resolveEnforcer(ref, rootDir));

  const structural = [];
  const policy = [];

  if (ledgerError) {
    structural.push({ reason: "ledger-unreadable", detail: ledgerError });
  }

  if (typeof docText !== "string" || !docText.trim()) {
    structural.push({ reason: "empty-document" });
    return finalize(structural, policy);
  }

  const lines = docText.split("\n");
  const blocks = findBlocks(lines);

  if (blocks.length === 0) {
    structural.push({ reason: "no-policy-blocks" });
    return finalize(structural, policy);
  }

  const coreBlocks = new Map(); // core_id -> { block, trailerKind, waivableFalse }

  for (const block of blocks) {
    const trailerMatches = [];
    for (const rawLine of block.lines) {
      const trimmed = rawLine.trim();
      if (ENFORCER_RE.test(trimmed)) trailerMatches.push({ kind: "Enforcer", line: trimmed });
      else if (DEFERRED_RE.test(trimmed)) trailerMatches.push({ kind: "Deferred", line: trimmed });
      else if (CORE_RE.test(trimmed)) trailerMatches.push({ kind: "Core", line: trimmed });
    }

    if (trailerMatches.length !== 1) {
      structural.push({ reason: "malformed-block-trailer", block: block.id, found: trailerMatches.length });
    } else {
      const trailer = trailerMatches[0];
      if (trailer.kind === "Enforcer") {
        const m = ENFORCER_RE.exec(trailer.line);
        const res = doResolve(m[1]);
        if (!res.resolved) {
          structural.push({ reason: "unresolvable-enforcer", block: block.id, detail: res.error });
        }
      } else if (trailer.kind === "Deferred") {
        const m = DEFERRED_RE.exec(trailer.line);
        const edId = m[1];
        if (!ledgerIds || !ledgerIds.has(edId)) {
          structural.push({ reason: "missing-ed", block: block.id, ed: edId });
        }
      }

      // core_id tagging is INDEPENDENT of which trailer kind matched — a block
      // can be tagged core_id/waivable:false with the WRONG trailer (Deferred
      // instead of Core); that mismatch is the core-waived-by-ed case (AC-5),
      // a CONTENT/policy violation on an otherwise well-formed block.
      const blockText = block.lines.join("\n");
      const coreMatch = CORE_ID_RE.exec(blockText);
      if (coreMatch) {
        coreBlocks.set(coreMatch[1], {
          block: block.id,
          trailerKind: trailer.kind,
          waivableFalse: WAIVABLE_FALSE_RE.test(blockText),
        });
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
    const entry = coreBlocks.get(coreId);
    if (!entry) {
      policy.push({ reason: "core-incomplete", core: coreId });
      continue;
    }
    if (!entry.waivableFalse || entry.trailerKind !== "Core") {
      policy.push({ reason: "core-waived", core: coreId, block: entry.block, trailerKind: entry.trailerKind });
    }
  }

  if (!(fixtureCount > 0)) {
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

  let fixtureCount;
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    fixtureCount = typeof manifest.count === "number" ? manifest.count : undefined;
  } catch {
    fixtureCount = undefined;
  }

  return evaluate({ docText, ledgerIds, ledgerError, fixtureCount, rootDir });
}

module.exports = { evaluate, run, findBlocks, resolveEnforcer, parseLedgerIds, H1_SENTENCE };

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
