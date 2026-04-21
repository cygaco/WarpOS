#!/usr/bin/env node
/**
 * step-registry-guard.js — PreToolUse hook for Edit|Write.
 *
 * Warns when new code hardcodes an integer step instead of using the
 * `Step` enum from `src/lib/types.ts` (source of truth:
 * docs/00-canonical/STEPS.json).
 *
 * Non-blocking by default (warns on stderr). Set STEP_REGISTRY_GUARD_STRICT=1
 * to block.
 *
 * What it catches in newly-written content (source files only):
 *   - `currentStep === 5`, `currentStep <= 3`, `currentStep > 0` (any comparator)
 *   - `currentStep: 4` in object literals
 *   - `setCurrentStep(2)` with a numeric literal
 *
 * Skips (allowlist):
 *   - src/lib/types.ts             (defines the enum itself)
 *   - src/lib/constants.ts         (step metadata seed)
 *   - src/lib/storage.ts           (migration + validation sites)
 *   - src/lib/test-harness.ts      (test fixtures)
 *   - scripts/hooks/**              (hooks themselves)
 *   - Any .md file                 (specs describe steps by number in prose)
 *
 * Only runs on Edit|Write to source files (.ts, .tsx, .js, .jsx) under src/.
 */

const fs = require("fs");
const path = require("path");

const { PROJECT, PATHS, relPath } = require("./lib/paths");

const STRICT = process.env.STEP_REGISTRY_GUARD_STRICT === "1";

const STEP_PATTERNS = [
  {
    re: /\bcurrentStep\s*(===|==|!==|!=|>=|<=|>|<)\s*\d+/g,
    why: "hardcoded integer comparison — use `Step.XYZ` + `STEP_TO_INT[Step.XYZ]` from src/lib/types.ts",
  },
  {
    re: /\bcurrentStep\s*:\s*\d+/g,
    why: "integer literal in object — use `STEP_TO_INT[Step.XYZ]` (source of truth: docs/00-canonical/STEPS.json)",
  },
  {
    re: /\bsetCurrentStep\s*\(\s*\d+\s*\)/g,
    why: "setCurrentStep with numeric literal — use `setCurrentStep(STEP_TO_INT[Step.XYZ])`",
  },
];

const ALLOW_LIST_SUBSTRINGS = [
  "src/lib/types.ts",
  "src/lib/constants.ts",
  "src/lib/storage.ts",
  "src/lib/test-harness.ts",
  "scripts/hooks/",
];

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let event;
  try {
    event = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const toolName = event.tool_name;
  if (toolName !== "Edit" && toolName !== "Write") {
    process.exit(0);
  }

  const filePath = event.tool_input?.file_path || "";
  const rel = relPath(filePath).replace(/\\/g, "/");

  // Source files only — specs describe steps by number in prose (intentional)
  if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(rel)) {
    process.exit(0);
  }

  // Only lint under src/ — hooks and tooling have their own conventions
  if (!rel.startsWith("src/")) {
    process.exit(0);
  }

  // Allowlist — intentional integer sites
  if (ALLOW_LIST_SUBSTRINGS.some((s) => rel.includes(s))) {
    process.exit(0);
  }

  const body =
    (event.tool_input?.content || "") +
    "\n" +
    (event.tool_input?.new_string || "");

  if (!body.trim()) {
    process.exit(0);
  }

  const findings = [];
  for (const { re, why } of STEP_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(body)) !== null) {
      findings.push({ match: m[0], why });
      if (findings.length >= 8) break;
    }
    if (findings.length >= 8) break;
  }

  if (findings.length === 0) {
    process.exit(0);
  }

  const lines = [
    `step-registry-guard: ${findings.length} hardcoded integer step reference(s) in ${rel}:`,
  ];
  for (const f of findings) {
    lines.push(`  • ${f.match} — ${f.why}`);
  }
  lines.push(
    "",
    "Source of truth: docs/00-canonical/STEPS.json. Use the `Step` enum",
    "from src/lib/types.ts (STEP_TO_INT / INT_TO_STEP) instead of raw integers.",
    "",
    "This is a WARNING — the edit is allowed. Fix at write-time to avoid",
    "accumulating tech debt. Set STEP_REGISTRY_GUARD_STRICT=1 to block.",
  );

  process.stderr.write(lines.join("\n") + "\n");

  // Best-effort log via shared logger (optional — never fail the hook)
  try {
    const loggerPath = path.join(
      PROJECT,
      "scripts",
      "hooks",
      "lib",
      "logger.js",
    );
    if (fs.existsSync(loggerPath)) {
      const { log } = require(loggerPath);
      log(
        "audit",
        {
          action: "step-hardcode-warn",
          file: rel,
          count: findings.length,
          patterns: findings.map((f) => f.match).slice(0, 5),
        },
        { actor: "step-registry-guard" },
      );
    }
  } catch {
    /* logger optional */
  }

  if (STRICT) {
    console.log(
      JSON.stringify({
        decision: "block",
        reason: `step-registry-guard: ${findings.length} hardcoded integer step reference(s) — use Step enum`,
      }),
    );
  }

  process.exit(0);
});
