#!/usr/bin/env node
/**
 * scan:warpos-install-baseline — preflight gate (F-4 mitigation).
 *
 * Verifies a WarpOS install baseline exists in the target project before
 * /warp:update may proceed. Without `--force-fresh`, the gate refuses
 * when `.claude/framework-installed.json` is missing OR
 * `installedVersion === "0.0.0"` (the silent-fallback sentinel).
 *
 * Status:
 *   green  — framework-installed.json present + installedVersion is real
 *   yellow — --force-fresh override accepted (preflight composer may
 *            interpret as green if override was opted in)
 *   red    — missing or sentinel 0.0.0 without override
 *
 * Output schema (IN-1).
 *
 * --guard-remediation MODE (C-8 / doogle WG-1 enforcer-class):
 *   A separate assertion — the "closed dispatch trap" backstop. Every script
 *   path a guard names in a USER-FACING remediation message ("Run: node
 *   scripts/X.js", "Use: …", a block() reason, a stderr instruction) must
 *   actually EXIST on disk. Otherwise a guard blocks the user and then points
 *   them at a file the install never shipped — a closed trap with no exit. This
 *   mode scans scripts/hooks/*.js, extracts remediation script paths, and fails
 *   if any is missing. It does NOT touch a target's framework-installed.json.
 *
 * Usage:
 *   node scripts/checks/warpos-install-baseline.js [--target <path>] [--force-fresh] [--json]
 *   node scripts/checks/warpos-install-baseline.js --guard-remediation [--json]
 *
 * Linked: SP-20260513-005 / S-4 / AC-S-4.2 / R-4 / C-1 / F-4 / C-8 / doogle WG-1
 */

const fs = require("fs");
const path = require("path");

const START = Date.now();
const NAME = "warpos-install-baseline";

function arg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] || null;
}
const JSON_OUT = process.argv.includes("--json");
const FORCE_FRESH = process.argv.includes("--force-fresh");
const GUARD_REMEDIATION = process.argv.includes("--guard-remediation");
const TARGET_ROOT = path.resolve(
  arg("--target") || process.env.CLAUDE_PROJECT_DIR || process.cwd(),
);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

function emit(result) {
  const out = {
    name: NAME,
    status: result.status,
    reason: result.reason,
    remediation: result.remediation || null,
    durationMs: Date.now() - START,
    evidence: result.evidence || {},
  };
  if (JSON_OUT) {
    console.log(JSON.stringify(out));
  } else if (result.status === "green") {
    console.log(`OK   [${NAME}] ${result.reason}`);
  } else if (result.status === "yellow") {
    console.log(`WARN [${NAME}] ${result.reason}`);
  } else {
    console.error(`FAIL [${NAME}] ${result.reason}`);
    if (result.remediation) console.error(`     fix: ${result.remediation}`);
  }
  process.exit(result.status === "red" ? 1 : 0);
}

// ── C-8: guard-remediation-path existence (the "closed dispatch trap") ──
//
// Extract script paths a guard tells the USER to run, from remediation/
// user-facing surfaces only — NOT every script path in the file (a require()
// or a comment is not a trap). We scope to lines that look like guidance:
// a block()/console.error()/process.stderr.write() call, or a line carrying a
// "Run:"/"Use:"/"fix:" remediation cue. Then we pull scripts/<...>.<ext> tokens
// with a STRICT extension boundary so `.json` artifacts never match `.js`.

// Executable script extensions a guard could ask a user to RUN. Deliberately
// excludes .json/.md/.ps1xml etc. — a guard naming a data file isn't a dispatch
// trap, and .ps1/.sh ARE runnable so they stay in.
const RUNNABLE_EXT = "(?:js|cjs|mjs|ps1|sh)";
// scripts/<path>.<ext> with a trailing boundary that rejects `.json` (the `.js`
// of `.json` must not match): the char after <ext> must NOT be a word char or `.`.
const SCRIPT_PATH_RE = new RegExp(
  "scripts/[A-Za-z0-9_./-]+?\\." + RUNNABLE_EXT + "(?![A-Za-z0-9_.])",
  "g",
);
// A line is "remediation-bearing" if it emits user guidance.
const REMEDIATION_LINE_RE =
  /\bblock\s*\(|console\.error\s*\(|process\.stderr\.write\s*\(|\b(?:Run|Use|fix|Try|remediation)\b\s*:/i;

function extractRemediationPaths(source) {
  const out = new Set();
  for (const raw of source.split(/\r?\n/)) {
    if (!REMEDIATION_LINE_RE.test(raw)) continue;
    // Only pull paths that sit inside a STRING literal on this line — a bare
    // identifier path in code is not user-facing text.
    const stringRegions = raw.match(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g) || [];
    const haystack = stringRegions.length ? stringRegions.join(" ") : raw;
    let m;
    SCRIPT_PATH_RE.lastIndex = 0;
    while ((m = SCRIPT_PATH_RE.exec(haystack)) !== null) {
      out.add(m[0]);
    }
  }
  return Array.from(out);
}

function runGuardRemediationCheck() {
  // WARPOS_GUARD_REMEDIATION_ROOT is a test-only seam: point the scan at a
  // throwaway tree so the RED path can be exercised hermetically without a
  // false-RED on the real guard set.
  const scanRoot = process.env.WARPOS_GUARD_REMEDIATION_ROOT
    ? path.resolve(process.env.WARPOS_GUARD_REMEDIATION_ROOT)
    : REPO_ROOT;
  const hooksDir = path.join(scanRoot, "scripts", "hooks");
  let files = [];
  try {
    files = fs
      .readdirSync(hooksDir)
      .filter((f) => f.endsWith(".js"))
      .map((f) => path.join(hooksDir, f));
  } catch (e) {
    // fail-closed: an enforcer that can't read its inputs must not read green.
    emitGuardResult({
      status: "red",
      reason: `cannot read guard dir ${hooksDir}: ${e.message}`,
      missing: [],
      checked: 0,
    });
    return;
  }

  const missing = [];
  let pathCount = 0;
  for (const file of files) {
    let src;
    try {
      src = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const rel of extractRemediationPaths(src)) {
      pathCount++;
      const abs = path.join(scanRoot, rel);
      if (!fs.existsSync(abs)) {
        missing.push({
          guard: path.relative(scanRoot, file).replace(/\\/g, "/"),
          path: rel,
        });
      }
    }
  }

  if (missing.length > 0) {
    emitGuardResult({
      status: "red",
      reason: `${missing.length} guard remediation path(s) point at a file the install never shipped (closed-trap class)`,
      missing,
      checked: pathCount,
    });
    return;
  }
  emitGuardResult({
    status: "green",
    reason: `all ${pathCount} guard remediation script path(s) across ${files.length} guard(s) exist on disk`,
    missing: [],
    checked: pathCount,
  });
}

function emitGuardResult(r) {
  const out = {
    name: NAME + ":guard-remediation",
    status: r.status,
    reason: r.reason,
    missing: r.missing,
    checkedPaths: r.checked,
    durationMs: Date.now() - START,
  };
  if (JSON_OUT) {
    console.log(JSON.stringify(out));
  } else if (r.status === "green") {
    console.log(`OK   [${NAME}:guard-remediation] ${r.reason}`);
  } else {
    console.error(`FAIL [${NAME}:guard-remediation] ${r.reason}`);
    for (const m of r.missing) {
      console.error(`     - ${m.guard} → ${m.path} (MISSING)`);
    }
    console.error(
      "     fix: ship the referenced script, OR correct the guard's remediation message to name a file that exists.",
    );
  }
  process.exit(r.status === "red" ? 1 : 0);
}

function runBaselineCheck() {
const file = path.join(TARGET_ROOT, ".claude", "framework-installed.json");
const exists = fs.existsSync(file);

let installedVersion = null;
let malformed = false;
if (exists) {
  try {
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    installedVersion = j.installedVersion || j.version || null;
  } catch {
    malformed = true;
  }
}

const hasBaseline =
  exists && !malformed && installedVersion && installedVersion !== "0.0.0";

if (hasBaseline) {
  emit({
    status: "green",
    reason: `installed baseline ${installedVersion} present at ${path.relative(TARGET_ROOT, file).replace(/\\/g, "/")}`,
    evidence: { file, installedVersion },
  });
}

if (FORCE_FRESH) {
  emit({
    status: "yellow",
    reason: `no baseline (${exists ? `sentinel ${installedVersion || "<malformed>"}` : "file missing"}) but --force-fresh override accepted`,
    evidence: {
      file,
      exists,
      installedVersion,
      malformed,
      override: "--force-fresh",
    },
    remediation:
      "Override accepted. Apply will be treated as a fresh install (massive ADD_SAFE plan expected).",
  });
}

const reason = malformed
  ? `framework-installed.json malformed (not parseable JSON)`
  : exists
    ? `framework-installed.json present but installedVersion is sentinel ${installedVersion || "(missing field)"}`
    : `framework-installed.json not found at ${path.relative(TARGET_ROOT, file).replace(/\\/g, "/")} — this project has no installed WarpOS snapshot to update from.`;

emit({
  status: "red",
  reason,
  remediation: [
    "Run install.ps1 first (this is for upgrades, not fresh installs):",
    "  powershell -ExecutionPolicy Bypass -File <warpos-repo>/install.ps1",
    "Or, if a baseline exists in git history, restore it:",
    "  git checkout <prev-commit> -- .claude/framework-installed.json",
    "Override: --force-fresh (DANGER — treats this as a fresh install, produces a massive ADD_SAFE plan)",
  ].join("\n"),
  evidence: { file, exists, installedVersion, malformed },
});
}

// ── Dispatch (only when run directly; require() exposes the pure helpers) ──
if (require.main === module) {
  if (GUARD_REMEDIATION) {
    runGuardRemediationCheck();
  } else {
    runBaselineCheck();
  }
}

module.exports = { extractRemediationPaths };
