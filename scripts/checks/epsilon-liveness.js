#!/usr/bin/env node
"use strict";

/**
 * scripts/checks/epsilon-liveness.js — detect a stalled sprint conductor (WG-6).
 *
 * A stalled conductor is self-detecting: in-process evidence files exist but have
 * no matching completion record in the dispatch ledger after N minutes. This happens
 * when a teammate-ε dispatches subprocesses and goes idle waiting for returns that
 * will never re-wake it (WG-6 — observed ×3 as 25-minute stalls; the harness only
 * re-wakes a teammate on an incoming SendMessage, never on a subprocess completing).
 *
 * Logic:
 *   - Scan the evidence dir for *.return.txt files older than --stale-minutes (default 10).
 *   - For each stale file, look for a ledger record in dispatch-completions.jsonl that:
 *       (a) has evidence_sha matching the file's sha256 (primary match), OR
 *       (b) has sprint_id+step+role that reconstruct the file's basename (fallback match).
 *   - Missing record → epsilon-stalled finding → exit 1 (fail-closed).
 *   - Empty/missing dirs → exit 0 with "nothing to check" (not an error).
 *   - Malformed ledger line → count + warn; do NOT crash.
 *   - Fully unreadable ledger WITH evidence present → exit 1 (fail-closed; a gate must
 *     not green on a lying input).
 *
 * Usage:
 *   node scripts/checks/epsilon-liveness.js [--evidence-dir <path>]
 *       [--ledger <path>] [--stale-minutes <N>] [--now <ISO>] [--json]
 *
 * The pure evaluate() is exported for deterministic fixture tests.
 * Linked: doogle WG-6 / ED-041 / T-291 / epsilon.md TEAMMATE STALL RULES
 */

const fs = require("fs");
const { isVerifiedLivenessRecord } = require("../dispatch/verified-liveness-read");
const path = require("path");
const crypto = require("crypto");

const START = Date.now();
const NAME = "epsilon-liveness";

// Resolve from this script's own location so the check validates the tree it lives in —
// correct in a worktree (uncommitted edits) and when shipped.
const ROOT = path.resolve(__dirname, "..", "..");

// Default evidence directories to probe in order (first that exists wins, unless --evidence-dir).
const DEFAULT_EVIDENCE_DIRS = [
  path.join(ROOT, ".claude", "runtime", "epsilon-prompts"),
  path.join(ROOT, "runtime", "epsilon-prompts"),
];
const DEFAULT_LEDGER = path.join(ROOT, ".claude", "runtime", "dispatch-completions.jsonl");
const DEFAULT_STALE_MINUTES = 10;

function arg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] || null;
}

const JSON_OUT = process.argv.includes("--json");

// ── Pure core ──────────────────────────────────────────────────────────────

/**
 * Pure evaluation — no filesystem I/O.
 *
 * @param {object} opts
 * @param {Array<{path:string, mtimeMs:number, sha256:string}>} opts.evidenceFiles
 *   Evidence files already older than the stale threshold, with pre-computed sha256.
 * @param {string[]|null} opts.ledgerLines
 *   Raw lines from the completions ledger, or null if the ledger is unreadable.
 * @param {number} opts.nowMs
 *   Reference "now" in milliseconds (enables deterministic tests via --now).
 * @returns {{ ok:boolean, findings:Array, malformedLines:number, ledgerUnreadable:boolean }}
 */
function evaluate({ evidenceFiles, ledgerLines, nowMs }) {
  // Fail-closed: unreadable ledger + evidence present = cannot confirm completions.
  if (ledgerLines === null && evidenceFiles.length > 0) {
    return {
      ok: false,
      findings: evidenceFiles.map((f) => ({
        type: "epsilon-stalled",
        evidenceFile: f.path,
        reason: `ledger unreadable — cannot verify completion for stale evidence file (${Math.round((nowMs - f.mtimeMs) / 60000)}m old)`,
      })),
      malformedLines: 0,
      ledgerUnreadable: true,
    };
  }

  // No stale evidence → nothing to check.
  if (!evidenceFiles.length) {
    return { ok: true, findings: [], malformedLines: 0, ledgerUnreadable: false };
  }

  // Parse ledger records — warn on malformed lines; do NOT crash (partial ledger is usable).
  const records = [];
  let malformedLines = 0;
  for (const line of ledgerLines || []) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch {
      malformedLines++;
    }
  }

  const findings = [];
  for (const ef of evidenceFiles) {
    // FAIL-CLOSED (gauntlet 2026-06-10 qa lane): unreadable evidence cannot be
    // matched — always a finding, never a silent skip.
    if (ef.unreadable) {
      findings.push({
        type: "epsilon-stalled",
        evidenceFile: ef.path,
        reason: ef.mtimeMs === null
          ? "evidence file is un-stat-able — cannot verify freshness or completion (fail-closed)"
          : `evidence file aged ${Math.round((nowMs - ef.mtimeMs) / 60000)}m is unreadable — cannot verify completion (fail-closed)`,
      });
      continue;
    }
    const ageMins = Math.round((nowMs - ef.mtimeMs) / 60000);

    // Primary: sha256-based match — the ledger records evidence_sha for in-process spawns. The matching
    // record must be a VERIFIED liveness record (SP-20260718-004 R4 same-session choke-point) — a forged
    // ok:true record can't hide a stall. Default-on (WARPOS_LIVENESS_REQUIRE_SIG=0 for the fixture tests).
    const _reqSig = process.env.WARPOS_LIVENESS_REQUIRE_SIG !== "0";
    const shaMatch = records.find(
      (r) => r.evidence_sha === ef.sha256 && isVerifiedLivenessRecord(r, { requireSignature: _reqSig }),
    );
    if (shaMatch) continue;

    // Fallback: filename-based match.  Evidence filenames follow the convention
    // <sprint_id>-<step>-<role>.return.txt (epsilon-runtime record-inprocess pattern).
    const basename = path.basename(ef.path, ".return.txt");
    const filenameMatch = records.find((r) => {
      if (!r.ok) return false;
      if (!r.sprint_id || !r.step || !r.role) return false;
      return basename === `${r.sprint_id}-${r.step}-${r.role}`;
    });
    if (filenameMatch) continue;

    findings.push({
      type: "epsilon-stalled",
      evidenceFile: ef.path,
      reason: `no ledger record for evidence file aged ${ageMins}m — conductor may be stalled (WG-6)`,
    });
  }

  return { ok: findings.length === 0, findings, malformedLines, ledgerUnreadable: false };
}

// ── Filesystem helpers ────────────────────────────────────────────────────

function sha256ofFile(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/** Collect *.return.txt files older than staleMs in dir. Returns [] if dir missing/unreadable. */
function collectEvidence(evidenceDir, staleMs, nowMs) {
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(evidenceDir);
  } catch {
    return files;
  }
  for (const name of entries) {
    if (!name.endsWith(".return.txt")) continue;
    const full = path.join(evidenceDir, name);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      // FAIL-CLOSED (gauntlet 2026-06-10 qa lane): an un-stat-able evidence file
      // can prove neither freshness nor a ledger match — surface it, don't hide it.
      files.push({ path: full, mtimeMs: null, sha256: null, unreadable: true });
      continue;
    }
    const mtimeMs = stat.mtimeMs;
    if (nowMs - mtimeMs < staleMs) continue; // not stale yet
    let buf;
    try {
      buf = fs.readFileSync(full);
    } catch {
      // FAIL-CLOSED: stale AND unreadable — cannot be matched against the ledger.
      files.push({ path: full, mtimeMs, sha256: null, unreadable: true });
      continue;
    }
    files.push({ path: full, mtimeMs, sha256: sha256ofFile(buf) });
  }
  return files;
}

/** Read the completions ledger. Returns string[] on success, null if file is unreadable/missing. */
function readLedger(ledgerPath) {
  try {
    return fs.readFileSync(ledgerPath, "utf8").split(/\r?\n/);
  } catch {
    return null;
  }
}

// ── Output ────────────────────────────────────────────────────────────────

function emit(result, evidenceDir, ledgerPath) {
  const out = {
    name: NAME,
    status: result.ok ? "green" : "red",
    evidenceDir,
    ledger: ledgerPath,
    findings: result.findings,
    malformedLedgerLines: result.malformedLines,
    ledgerUnreadable: result.ledgerUnreadable,
    durationMs: Date.now() - START,
  };
  if (JSON_OUT) {
    console.log(JSON.stringify(out));
  } else if (result.ok) {
    console.log(`OK   [${NAME}] no stale unmatched evidence (nothing to check or all matched)`);
  } else {
    console.error(
      `FAIL [${NAME}] ${result.findings.length} stale evidence file(s) with no completion record:`,
    );
    for (const f of result.findings) {
      console.error(`     - ${path.basename(f.evidenceFile)}: ${f.reason}`);
    }
    if (result.malformedLines > 0) {
      console.error(`     (${result.malformedLines} malformed ledger line(s) skipped)`);
    }
    if (result.ledgerUnreadable) {
      console.error(`     fix: check dispatch-completions.jsonl is readable; run record-inprocess if conductor ran`);
    }
  }
  process.exit(result.ok ? 0 : 1);
}

// ── CLI entrypoint ────────────────────────────────────────────────────────

if (require.main === module) {
  const nowArg = arg("--now");
  const nowMs = nowArg ? Date.parse(nowArg) : Date.now();
  if (nowArg && isNaN(nowMs)) {
    process.stderr.write(`[${NAME}] invalid --now value: ${nowArg}\n`);
    process.exit(2);
  }

  const staleMinutes =
    parseInt(arg("--stale-minutes") || String(DEFAULT_STALE_MINUTES), 10) ||
    DEFAULT_STALE_MINUTES;
  const staleMs = staleMinutes * 60 * 1000;

  // Resolve evidence directory.
  let evidenceDir = arg("--evidence-dir");
  if (!evidenceDir) {
    evidenceDir =
      DEFAULT_EVIDENCE_DIRS.find((d) => {
        try {
          fs.accessSync(d);
          return true;
        } catch {
          return false;
        }
      }) || DEFAULT_EVIDENCE_DIRS[0];
  }
  evidenceDir = path.resolve(evidenceDir);

  const ledgerPath = path.resolve(arg("--ledger") || DEFAULT_LEDGER);

  const evidenceFiles = collectEvidence(evidenceDir, staleMs, nowMs);
  const ledgerLines = readLedger(ledgerPath);

  const result = evaluate({ evidenceFiles, ledgerLines, nowMs });

  if (result.malformedLines > 0) {
    process.stderr.write(
      `[${NAME}] WARN: ${result.malformedLines} malformed line(s) in ledger ${ledgerPath}\n`,
    );
  }

  emit(result, evidenceDir, ledgerPath);
}

module.exports = { evaluate };
