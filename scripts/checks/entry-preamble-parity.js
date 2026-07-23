#!/usr/bin/env node
"use strict";

/**
 * entry-preamble-parity.js — the named enforcer for the single-source "entering-agent preamble"
 * (SP-20260723-001, ADR-0036).
 *
 * The shared entering-agent block lives ONCE, canonically, at
 * `.claude/project/reference/entry-preamble.md` between a pair of HTML-comment markers
 * (`WARPOS:ENTERING-AGENT-PREAMBLE:BEGIN`/`:END`). Every provider-neutral entry doc — `CODEX.md`,
 * `ANTIGRAVITY.md`, `GEMINI.md`, and a section of `AGENTS.md` — embeds that block VERBATIM. This
 * enforcer keys on REAL FILE BYTES only (never a self-declared field): it re-extracts the marked
 * region from each embedder, hashes it, and compares against the hash of the canonical source's own
 * region. A canonical file can never grade itself — the canonical's region IS the oracle every other
 * file is checked against, so a shim can never fabricate its own pass.
 *
 * Checks (each failing check is a finding):
 *   1. EXISTS       — every required entry file is present.
 *   2. REGION       — every embedder has a non-empty marked region (a shim that dropped the block
 *                      entirely is a defect distinct from thinness).
 *   3. HASH-PARITY  — sha256(extractRegion(file)) === sha256(extractRegion(canonical)).
 *   4. THINNESS     — for files with a declared tier, the bytes/lines OUTSIDE the marked region
 *                      (never the shared block itself) must stay within the tier's bound.
 *
 * Exit: 0 clean · 1 one or more findings · 2 could-not-run (canonical unreadable, internal error —
 * NEVER a silent green). Supports `--json`.
 *
 *   node scripts/checks/entry-preamble-parity.js [--json]
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const NAME = "entry-preamble-parity";
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");

const BEGIN = /<!--\s*WARPOS:ENTERING-AGENT-PREAMBLE:BEGIN[^>]*-->/;
const END = /<!--\s*WARPOS:ENTERING-AGENT-PREAMBLE:END[^>]*-->/;

// Tier bounds apply to the DELTA — the file's bytes/lines OUTSIDE the marked region (everything
// except the region between-and-including the markers). The shared block is identical everywhere
// and must never count against a file's thinness.
const TIERS = {
  tombstone: { maxBytes: 2048, maxLines: 40 },
  "full-entry": { maxBytes: 8192, maxLines: 120 },
};

// The canonical oracle — the SOLE source of the expected hash. Never hash a shim as the oracle.
const CANONICAL_REL = ".claude/project/reference/entry-preamble.md";

// Hard-coded per-file config table (SP-20260723-001).
const FILES = [
  { rel: CANONICAL_REL, existsRequired: true, embeds: true, tier: null, canonical: true },
  { rel: "CLAUDE.md", existsRequired: true, embeds: false, tier: null },
  { rel: "AGENTS.md", existsRequired: true, embeds: true, tier: null },
  { rel: "CODEX.md", existsRequired: true, embeds: true, tier: "full-entry" },
  { rel: "ANTIGRAVITY.md", existsRequired: true, embeds: true, tier: "full-entry" },
  { rel: "GEMINI.md", existsRequired: true, embeds: true, tier: "tombstone" },
];

/**
 * Extract the marked region's INNER content (strictly between the marker lines, edge-blank-trimmed).
 * CRLF/CR are normalized to LF (Windows safety) before scanning. No further normalization — no
 * whitespace-collapse, no lowercasing: over-normalizing would mask a real word-level edit, which is
 * itself a false-green. Returns null when no complete BEGIN/END pair is found.
 */
function extractRegion(txt) {
  const lines = txt.replace(/\r\n?/g, "\n").split("\n");
  let b = -1;
  let e = -1;
  for (let i = 0; i < lines.length; i++) {
    if (b < 0 && BEGIN.test(lines[i])) {
      b = i;
      continue;
    }
    if (b >= 0 && END.test(lines[i])) {
      e = i;
      break;
    }
  }
  if (b < 0 || e < 0) return null;
  let inner = lines.slice(b + 1, e);
  while (inner.length && inner[0].trim() === "") inner.shift();
  while (inner.length && inner[inner.length - 1].trim() === "") inner.pop();
  return inner.join("\n");
}

/**
 * Split a file's normalized text into the content OUTSIDE the marked region — i.e. everything
 * except the span from the BEGIN marker line through the END marker line, inclusive. Returns
 * { byteLength, lineCount } for the thinness check, or null when no marker pair is found.
 */
function splitOutsideRegion(txt) {
  const lines = txt.replace(/\r\n?/g, "\n").split("\n");
  let b = -1;
  let e = -1;
  for (let i = 0; i < lines.length; i++) {
    if (b < 0 && BEGIN.test(lines[i])) {
      b = i;
      continue;
    }
    if (b >= 0 && END.test(lines[i])) {
      e = i;
      break;
    }
  }
  if (b < 0 || e < 0) return null;
  const outsideLines = lines.slice(0, b).concat(lines.slice(e + 1));
  const outsideText = outsideLines.join("\n");
  return { byteLength: Buffer.byteLength(outsideText, "utf8"), lineCount: outsideLines.length };
}

function sha256(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/**
 * Pure core. `repoRoot` defaults to the live repo; a caller (the test) may pass a fixture root so
 * negative cases run against temp copies, never the real entry docs.
 *
 * Throws (fail-closed — the caller must exit 2, never a silent green) when the canonical oracle is
 * unreadable, or is readable but carries no marked region of its own (no oracle hash can be derived).
 *
 * Returns { findings: [{file, reason}], canonicalHash }.
 */
function runParity({ repoRoot = ROOT } = {}) {
  const canonicalAbs = path.join(repoRoot, CANONICAL_REL);
  let canonicalText;
  try {
    canonicalText = fs.readFileSync(canonicalAbs, "utf8");
  } catch (e) {
    throw new Error(
      `canonical oracle unreadable at ${CANONICAL_REL}: ${e && e.message ? e.message : e}`,
    );
  }
  const canonicalRegion = extractRegion(canonicalText);
  if (canonicalRegion === null || canonicalRegion.length === 0) {
    throw new Error(`canonical oracle at ${CANONICAL_REL} carries no marked preamble region`);
  }
  const canonicalHash = sha256(canonicalRegion);

  const findings = [];

  for (const cfg of FILES) {
    const abs = path.join(repoRoot, cfg.rel);
    const exists = fs.existsSync(abs);

    if (!exists) {
      if (cfg.existsRequired) {
        findings.push({ file: cfg.rel, reason: "required entry file is missing" });
      }
      continue; // nothing further to check on a missing file
    }

    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch (e) {
      findings.push({ file: cfg.rel, reason: `unreadable: ${e && e.message ? e.message : e}` });
      continue;
    }

    if (cfg.embeds) {
      const region = extractRegion(text);
      if (region === null || region.length === 0) {
        findings.push({
          file: cfg.rel,
          reason: "no marked entering-agent-preamble region found (dropped shim)",
        });
      } else if (!cfg.canonical && sha256(region) !== canonicalHash) {
        findings.push({
          file: cfg.rel,
          reason: "embedded preamble region has drifted from the canonical oracle (hash mismatch)",
        });
      }
    }

    if (cfg.tier) {
      const bound = TIERS[cfg.tier];
      const outside = splitOutsideRegion(text);
      if (outside === null) {
        // Already reported as a dropped-region finding above; thinness cannot be evaluated without
        // a region to measure around, so don't double-report.
      } else if (outside.byteLength > bound.maxBytes || outside.lineCount > bound.maxLines) {
        findings.push({
          file: cfg.rel,
          reason: `oversized shim (tier "${cfg.tier}"): ${outside.byteLength} bytes / ${outside.lineCount} lines outside the marked region (bound: ${bound.maxBytes} bytes / ${bound.maxLines} lines)`,
        });
      }
    }
  }

  return { findings, canonicalHash };
}

module.exports = { runParity, extractRegion, splitOutsideRegion, FILES, TIERS, CANONICAL_REL };

if (require.main === module) {
  const JSON_OUT = process.argv.includes("--json");
  let res;
  try {
    res = runParity({});
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    if (JSON_OUT) console.log(JSON.stringify({ check: NAME, ok: false, error: msg }));
    else console.error(`FAIL [${NAME}] could not run (fail-closed): ${msg}`);
    process.exit(2);
  }

  const ok = res.findings.length === 0;
  if (JSON_OUT) {
    console.log(JSON.stringify({ check: NAME, ok, findings: res.findings }));
  } else if (ok) {
    console.log(
      `OK   [${NAME}] ${FILES.length} entry file(s) checked — canonical hash parity + thinness clean.`,
    );
  } else {
    console.error(`FAIL [${NAME}] ${res.findings.length} finding(s) in the entry-preamble graph:`);
    for (const f of res.findings) console.error(`  - ${f.file}: ${f.reason}`);
  }
  process.exit(ok ? 0 : 1);
}
