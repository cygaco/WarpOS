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

// --- STEPS.json registry schema validation ---------------------------
// Runs when the user edits docs/00-canonical/STEPS.json. Reconstructs
// the post-edit file body (content for Write; old → new swap for Edit),
// parses it, and checks invariants. Warns on any violation. In strict
// mode (STEP_REGISTRY_GUARD_STRICT=1), emits a block decision.

function reconstructPostEditBody(event) {
  const ti = event.tool_input || {};
  if (event.tool_name === "Write") {
    return typeof ti.content === "string" ? ti.content : "";
  }
  if (event.tool_name === "Edit") {
    const filePath = ti.file_path || "";
    let current = "";
    try {
      current = fs.readFileSync(filePath, "utf8");
    } catch {
      return null; // can't read original — skip validation
    }
    const oldStr = ti.old_string || "";
    const newStr = ti.new_string || "";
    if (!oldStr) return newStr || current;
    const idx = current.indexOf(oldStr);
    if (idx < 0) return null; // old_string not found — Edit will fail anyway
    return current.slice(0, idx) + newStr + current.slice(idx + oldStr.length);
  }
  return null;
}

function validateStepsRegistry(event, rel) {
  const body = reconstructPostEditBody(event);
  if (body == null) return; // best-effort — don't block what we can't reason about

  let registry;
  try {
    registry = JSON.parse(body);
  } catch (e) {
    emitRegistryFindings(rel, [
      `post-edit body is not valid JSON: ${e.message}`,
    ]);
    return;
  }

  const findings = [];

  // Top-level shape
  if (typeof registry.version !== "number")
    findings.push("missing or non-numeric `version`");
  if (!registry.phases || typeof registry.phases !== "object")
    findings.push("missing or non-object `phases`");
  if (!registry.steps || typeof registry.steps !== "object")
    findings.push("missing or non-object `steps`");
  if (findings.length) {
    emitRegistryFindings(rel, findings);
    return;
  }

  // Phase ↔ step membership: every id listed in phases.*.steps exists in steps
  const phaseNames = Object.keys(registry.phases);
  const stepIds = new Set(Object.keys(registry.steps));
  for (const ph of phaseNames) {
    const phaseDef = registry.phases[ph] || {};
    const listed = Array.isArray(phaseDef.steps) ? phaseDef.steps : [];
    for (const id of listed) {
      if (!stepIds.has(id)) {
        findings.push(`phase "${ph}" lists unknown step "${id}"`);
      }
    }
  }

  // Every step must declare a phase that exists, and should appear in that phase's listing
  for (const [id, step] of Object.entries(registry.steps)) {
    if (!step || typeof step !== "object") {
      findings.push(`step "${id}" is not an object`);
      continue;
    }
    const ph = step.phase;
    if (!ph || !phaseNames.includes(ph)) {
      findings.push(`step "${id}" has unknown or missing phase "${ph}"`);
    } else {
      const listed = Array.isArray(registry.phases[ph].steps)
        ? registry.phases[ph].steps
        : [];
      if (!listed.includes(id)) {
        findings.push(
          `step "${id}" declares phase "${ph}" but is not listed in phases.${ph}.steps`,
        );
      }
    }
    // Required fields
    for (const req of ["position", "component", "feature"]) {
      if (step[req] === undefined) {
        findings.push(`step "${id}" missing required field "${req}"`);
      }
    }
    if (typeof step.position !== "number" || !Number.isInteger(step.position)) {
      findings.push(`step "${id}" position must be an integer`);
    }
  }

  // Positions unique
  const positionsSeen = new Map();
  for (const [id, step] of Object.entries(registry.steps)) {
    if (typeof step?.position !== "number") continue;
    const prev = positionsSeen.get(step.position);
    if (prev)
      findings.push(`position ${step.position} collides: ${prev} and ${id}`);
    else positionsSeen.set(step.position, id);
  }

  if (findings.length) emitRegistryFindings(rel, findings);
}

function emitRegistryFindings(rel, findings) {
  const lines = [
    `step-registry-guard: STEPS.json schema validation found ${findings.length} issue(s):`,
  ];
  for (const f of findings) lines.push(`  • ${f}`);
  lines.push(
    "",
    "The registry at docs/00-canonical/STEPS.json is the source of truth",
    "for step order + phase membership. Downstream: src/lib/types.ts `Step`",
    "enum, the 3 canonical docs' step tables, scripts/hooks/step-registry-guard.js.",
    "",
    "This is a WARNING — the edit is allowed. Fix at write-time to avoid",
    "runtime breakage. Set STEP_REGISTRY_GUARD_STRICT=1 to block.",
  );
  process.stderr.write(lines.join("\n") + "\n");

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
          action: "steps-registry-schema-warn",
          file: rel,
          count: findings.length,
          findings: findings.slice(0, 5),
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
        reason: `step-registry-guard: STEPS.json schema violations (${findings.length})`,
      }),
    );
  }
}

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

  // Branch A: edits to the STEPS.json registry itself → schema validation.
  if (rel.endsWith("docs/00-canonical/STEPS.json")) {
    validateStepsRegistry(event, rel);
    process.exit(0);
  }

  // Branch B: edits to source files → scan for hardcoded integer steps.

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
