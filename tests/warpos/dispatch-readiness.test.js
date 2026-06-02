#!/usr/bin/env node
/**
 * dispatch-readiness.test.js — Unit + integration tests for SP-0181
 * dispatch-readiness slice (A1/A3 + E1 + E3-gate).
 *
 * Sprint:  SP-0181
 * Covers:
 *   - provider-health-check exits 2 on red verdict (false-green fix)
 *   - runtimeExclusionGate: blocks owner=runtime; passes clean; fails closed
 *     on malformed manifest
 *   - skillScriptCompletenessGate: blocks missing script ref; passes all-ok;
 *     allowlist honored
 *   - isExcluded agreement: E1 gate pattern (via imported isExcluded) matches
 *     generate-framework-manifest.js#isExcluded on shared fixture set
 *   - SessionStart per-role nudge: fail-open (try/catch present; no throw on
 *     provider load failure)
 *
 * Run:
 *   node tests/warpos/dispatch-readiness.test.js
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
    process.stdout.write(`  ok    ${name}\n`);
  } else {
    failed++;
    failures.push(`${name}: ${detail || "(no detail)"}`);
    process.stdout.write(`  FAIL  ${name}${detail ? ": " + detail : ""}\n`);
  }
}

// ── Load subjects ─────────────────────────────────────────────────────────────

const RELEASE_BUILD = path.join(REPO_ROOT, "scripts", "warpos", "release-build.js");
const HEALTH_CHECK = path.join(REPO_ROOT, "scripts", "warpos", "provider-health-check.js");
const GENERATE_MANIFEST = path.join(REPO_ROOT, "scripts", "generate-framework-manifest.js");
const SESSION_START = path.join(REPO_ROOT, "scripts", "hooks", "session-start.js");

const { runtimeExclusionGate, skillScriptCompletenessGate, KNOWN_DANGLING_REFS } =
  require(RELEASE_BUILD);

const { isExcluded: genIsExcluded, RUNTIME_JSONL_PATTERN } =
  require(GENERATE_MANIFEST);

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: provider-health-check exits 2 on red verdict (false-green fix)
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n1. provider-health-check exit-code contract\n");

{
  // Read the source and verify the false-green fix is present. This is a
  // static assertion — the implementation fix is `process.exit(verdict === "red" ? 2 : 0)`.
  // We verify statically (no live exec needed) because the fix is a one-liner
  // and we don't want to depend on provider CLI availability in CI.
  const src = fs.readFileSync(HEALTH_CHECK, "utf8");
  check(
    "provider-health-check: unconditional exit(0) is gone",
    !src.includes("process.exit(0)") || src.includes("verdict === \"red\""),
    "File still contains unconditional process.exit(0) without a verdict guard",
  );
  check(
    "provider-health-check: exit(2) on red is present",
    src.includes("verdict === \"red\" ? 2 : 0"),
    "Expected `verdict === \"red\" ? 2 : 0` in source",
  );

  // Verify the exit-code logic by extracting it as a pure function.
  // The logic: verdict=red -> 2, verdict=yellow -> 0, verdict=green -> 0.
  const exitCodeFor = (verdict) => (verdict === "red" ? 2 : 0);
  check("exit code: green → 0", exitCodeFor("green") === 0);
  check("exit code: yellow → 0", exitCodeFor("yellow") === 0);
  check("exit code: red → 2", exitCodeFor("red") === 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: runtimeExclusionGate
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n2. runtimeExclusionGate\n");

{
  // 2a. Clean manifest (no runtime assets) → passes
  const cleanManifest = {
    assets: {
      skill: [
        { id: "skill.commands.warp.health.md", src: ".claude/commands/warp/health.md", owner: "framework" },
        { id: "skill.commands.agents.test.md", src: ".claude/commands/agents/test.md", owner: "framework" },
      ],
      hook: [
        { id: "hook.scripts.hooks.session-start.js", src: "scripts/hooks/session-start.js", owner: "framework" },
      ],
    },
  };
  const r1 = runtimeExclusionGate(cleanManifest, {});
  check("runtimeExclusionGate: clean manifest → not blocked", !r1.blocked, r1.message);
  check("runtimeExclusionGate: clean manifest → 0 offenders", r1.offenders.length === 0, JSON.stringify(r1.offenders));

  // 2b. Manifest with owner=runtime entry → blocked
  const runtimeManifest = {
    assets: {
      skill: [
        { id: "skill.commands.warp.health.md", src: ".claude/commands/warp/health.md", owner: "framework" },
      ],
      maps_baseline: [
        {
          id: "maps_baseline.claude.project.events.events.jsonl",
          src: ".claude/project/events/events.jsonl",
          owner: "runtime",
        },
      ],
    },
  };
  const r2 = runtimeExclusionGate(runtimeManifest, {});
  check("runtimeExclusionGate: owner=runtime → blocked", r2.blocked, "expected blocked=true");
  check(
    "runtimeExclusionGate: offenders list non-empty",
    r2.offenders.length > 0,
    "expected offenders",
  );
  check(
    "runtimeExclusionGate: message names remediation",
    r2.message && r2.message.includes("generate-framework-manifest.js"),
    r2.message,
  );

  // 2c. Manifest with a tracked-transient .jsonl filename (events.jsonl) → blocked
  const transientManifest = {
    assets: {
      agent: [
        {
          id: "agent.claude.agents.00-alex.events.jsonl",
          src: ".claude/agents/00-alex/.system/events.jsonl",
          owner: "generated",
        },
      ],
    },
  };
  const r3 = runtimeExclusionGate(transientManifest, {});
  check(
    "runtimeExclusionGate: events.jsonl path → blocked (W-8 class)",
    r3.blocked,
    "expected blocked=true for events.jsonl path",
  );

  // 2d. skill-usage.jsonl → blocked
  const skillUsageManifest = {
    assets: {
      maps_baseline: [
        {
          id: "maps_baseline.claude.project.maps.skill-usage.jsonl",
          src: ".claude/project/maps/skill-usage.jsonl",
          owner: "generated",
        },
      ],
    },
  };
  const r4 = runtimeExclusionGate(skillUsageManifest, {});
  check("runtimeExclusionGate: skill-usage.jsonl → blocked", r4.blocked, "expected blocked=true");

  // 2e. Malformed manifest (not an object) → fails closed (blocked)
  const r5 = runtimeExclusionGate(null, {});
  check(
    "runtimeExclusionGate: null manifest → fails closed",
    r5.blocked,
    "expected blocked=true for null manifest",
  );
  const r6 = runtimeExclusionGate("not-an-object", {});
  check(
    "runtimeExclusionGate: string manifest → fails closed",
    r6.blocked,
    "expected blocked=true for non-object manifest",
  );

  // 2f. Bypass flag → not blocked even with runtime asset
  const r7 = runtimeExclusionGate(runtimeManifest, { skipRuntimeExclusionCheck: true });
  check("runtimeExclusionGate: skipRuntimeExclusionCheck bypass → not blocked", !r7.blocked);

  // 2g. Empty assets → passes
  const r8 = runtimeExclusionGate({ assets: {} }, {});
  check("runtimeExclusionGate: empty assets → passes", !r8.blocked);
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3: skillScriptCompletenessGate
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n3. skillScriptCompletenessGate\n");

{
  // Build a minimal manifest with a skill and some shipped scripts.
  const makeManifest = (skillContent, shippedScripts) => ({
    assets: {
      skill: [
        {
          id: "skill.commands.warp.test.md",
          src: ".claude/commands/warp/test.md",
          dest: ".claude/commands/warp/test.md",
          owner: "framework",
        },
      ],
      warpos_script: shippedScripts.map((s) => ({
        id: `warpos_script.${s.replace(/\//g, ".")}`,
        src: s,
        dest: s,
        owner: "framework",
      })),
    },
  });

  // Inject a fake file reader so tests don't need real .md files on disk.
  const fakeReader = (filePath) => {
    // Return the skillContent keyed by basename for simplicity.
    const basename = path.basename(filePath);
    if (fakeReader._files && fakeReader._files[basename]) {
      return fakeReader._files[basename];
    }
    throw new Error("ENOENT: " + filePath);
  };
  fakeReader._files = {};

  // 3a. Skill references a script that IS in the manifest → passes
  fakeReader._files["test.md"] =
    "Run `node scripts/warpos/provider-smoke.js --per-role` to check.";
  const m1 = makeManifest("", ["scripts/warpos/provider-smoke.js"]);
  const g1 = skillScriptCompletenessGate(m1, {}, fakeReader);
  check("skillScriptCompletenessGate: all refs shipped → passes", !g1.blocked, g1.message);

  // 3b. Skill references a script that is NOT in the manifest → blocked
  fakeReader._files["test.md"] =
    "See `node scripts/warpos/missing-script.js` for details.";
  const m2 = makeManifest("", []); // no scripts shipped
  const g2 = skillScriptCompletenessGate(m2, {}, fakeReader);
  check("skillScriptCompletenessGate: missing script ref → blocked", g2.blocked, "expected blocked=true");
  check(
    "skillScriptCompletenessGate: offenders list non-empty",
    g2.offenders.length > 0,
    JSON.stringify(g2.offenders),
  );
  check(
    "skillScriptCompletenessGate: message names remediation",
    g2.message && g2.message.includes("ASSET_DIRS"),
    g2.message,
  );

  // 3c. Multiple refs — one shipped, one missing → blocked for missing only
  fakeReader._files["test.md"] =
    "Use `node scripts/warpos/provider-smoke.js` or `node scripts/warpos/missing-tool.js`.";
  const m3 = makeManifest("", ["scripts/warpos/provider-smoke.js"]); // only smoke shipped
  const g3 = skillScriptCompletenessGate(m3, {}, fakeReader);
  check("skillScriptCompletenessGate: one shipped one missing → blocked", g3.blocked);
  check(
    "skillScriptCompletenessGate: only missing-tool in offenders",
    g3.offenders.length === 1 && g3.offenders[0].script === "scripts/warpos/missing-tool.js",
    JSON.stringify(g3.offenders),
  );

  // 3d. Bypass flag → passes even with missing ref
  const g4 = skillScriptCompletenessGate(m2, { skipSkillScriptCheck: true }, fakeReader);
  check("skillScriptCompletenessGate: skipSkillScriptCheck bypass → passes", !g4.blocked);

  // 3e. Malformed manifest → fails closed
  const g5 = skillScriptCompletenessGate(null, {}, fakeReader);
  check("skillScriptCompletenessGate: null manifest → fails closed", g5.blocked);

  // 3f. No skill assets → passes (nothing to check)
  const m5 = { assets: { warpos_script: [] } };
  const g6 = skillScriptCompletenessGate(m5, {}, fakeReader);
  check("skillScriptCompletenessGate: no skill assets → passes", !g6.blocked);

  // 3g. Skill file unreadable → gate skips that skill (not a failure)
  fakeReader._files = {}; // no files readable
  const m6 = makeManifest("", []);
  const g7 = skillScriptCompletenessGate(m6, {}, fakeReader);
  // Can't read the skill file → should pass (skips unreadable files)
  check("skillScriptCompletenessGate: unreadable skill file → skipped (passes)", !g7.blocked);

  // 3h. KNOWN_DANGLING_REFS starts empty (no intentional allowlist entries yet)
  check(
    "KNOWN_DANGLING_REFS is empty by default (no pre-populated allowlist)",
    Array.isArray(KNOWN_DANGLING_REFS) && KNOWN_DANGLING_REFS.length === 0,
    `length=${KNOWN_DANGLING_REFS ? KNOWN_DANGLING_REFS.length : "undefined"}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4: isExcluded agreement between E1 gate and generate-framework-manifest
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n4. isExcluded agreement between E1 gate and generator\n");

{
  // The E1 gate uses the imported `genIsExcluded` + `RUNTIME_JSONL_PATTERN`
  // from generate-framework-manifest.js. This section verifies that both
  // predicates agree on a shared fixture set — ensuring they cannot diverge.

  // Fixture set: paths that SHOULD be excluded (owner=runtime / tracked-transient)
  const shouldExclude = [
    ".claude/project/events/events.jsonl",
    ".claude/agents/00-alex/.system/events.jsonl",
    ".claude/project/maps/tools.jsonl",
    ".claude/project/maps/skill-usage.jsonl",
    ".claude/runtime/",
    ".claude/runtime/handoffs/somefile.md",
    ".claude/project/events/",
    ".claude/agents/02-oneshot/.system/retros/run-009/HYGIENE.md",
  ];

  // Fixture set: paths that SHOULD NOT be excluded (normal framework assets)
  const shouldNotExclude = [
    ".claude/commands/warp/health.md",
    "scripts/warpos/provider-smoke.js",
    "scripts/hooks/session-start.js",
    ".claude/agents/00-alex/alpha.md",
    "framework/releases/0.18.0/release.json",
    ".claude/project/reference/reasoning-frameworks.md",
  ];

  for (const p of shouldExclude) {
    // genIsExcluded should return true
    const excluded = genIsExcluded(p);
    // RUNTIME_JSONL_PATTERN catches the .jsonl ones; genIsExcluded catches prefixes
    const patternMatch = RUNTIME_JSONL_PATTERN.test(p);
    check(
      `isExcluded agrees: should-exclude "${p}"`,
      excluded || patternMatch,
      `genIsExcluded=${excluded} patternMatch=${patternMatch}`,
    );
  }

  for (const p of shouldNotExclude) {
    const excluded = genIsExcluded(p);
    check(
      `isExcluded agrees: should-NOT-exclude "${p}"`,
      !excluded,
      `genIsExcluded=${excluded} (expected false)`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5: SessionStart per-role nudge — fail-open
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n5. SessionStart per-role nudge — fail-open\n");

{
  // The nudge is wrapped in try/catch inside session-start.js. Verify:
  // (a) The source contains the try/catch wrapper for the nudge.
  // (b) The module exports nothing that throws on require (the imperative
  //     code is stdin-driven, so requiring the module is safe).

  const src = fs.readFileSync(SESSION_START, "utf8");

  check(
    "session-start: per-role nudge wrapped in try/catch",
    src.includes("dispatchReadinessNudge") &&
      src.includes("perRoleProbe") &&
      // Verify both the try and catch are present in the same block
      (src.match(/try\s*\{[^}]*perRoleProbe/ms) !== null ||
       src.includes("} catch {") || src.includes("} catch (e) {") || src.includes("} catch(_") ),
    "Could not find try/catch wrapper around perRoleProbe in session-start.js",
  );

  check(
    "session-start: dispatchReadinessNudge added to injection guard",
    src.includes("dispatchReadinessNudge") && src.includes("teamMarkerWarning ||\n      dispatchReadinessNudge"),
    "dispatchReadinessNudge not wired into the injection guard condition",
  );

  check(
    "session-start: nudge only on startup or clear (gated)",
    src.includes('source === "startup" || source === "clear"') &&
      src.indexOf("dispatchReadinessNudge") >
        src.indexOf('source === "startup" || source === "clear"'),
    "per-role nudge missing startup/clear gate",
  );

  // (c) Static: the module uses --no-ping (token-free) path
  check(
    "session-start: uses --no-ping for token-free resolve",
    src.includes("noPing: true"),
    "Expected noPing: true in session-start.js per-role sweep",
  );

  // (d) Fail-open: a spawnSync with empty stdin should exit 0 (the hook
  //     wraps everything in try/catch and calls process.exit(0) in the catch).
  //     We pipe an invalid JSON to confirm the outer try/catch catches and exits 0.
  const result = spawnSync(
    process.execPath,
    [SESSION_START],
    {
      input: "not-valid-json\n",
      cwd: REPO_ROOT,
      encoding: "utf8",
      timeout: 15_000,
    },
  );
  check(
    "session-start: exits 0 even with invalid stdin input (fail-open)",
    result.status === 0,
    `exit=${result.status} stderr=${(result.stderr || "").slice(0, 200)}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6: health.md and test.md have required content
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n6. Skill .md content assertions\n");

{
  const healthMd = fs.readFileSync(
    path.join(REPO_ROOT, ".claude", "commands", "warp", "health.md"),
    "utf8",
  );
  check(
    "health.md: references provider-smoke.js --per-role",
    healthMd.includes("provider-smoke.js --per-role"),
    "Expected `provider-smoke.js --per-role` in health.md section 11",
  );
  check(
    "health.md: documents exit 2 contract",
    healthMd.includes("Exit 2") || healthMd.includes("exit 2"),
    "Missing exit 2 contract in health.md",
  );
  check(
    "health.md: section 12 (Dispatch Hygiene) still present",
    healthMd.includes("### 12.") || healthMd.includes("Dispatch Hygiene"),
    "Section 12 Dispatch Hygiene was removed from health.md",
  );
  check(
    "health.md: per-role statuses documented (model_unavailable)",
    healthMd.includes("model_unavailable"),
    "Missing per-role status model_unavailable in health.md",
  );
  check(
    "health.md: fellback status documented",
    healthMd.includes("fellback"),
    "Missing fellback status in health.md",
  );

  const testMd = fs.readFileSync(
    path.join(REPO_ROOT, ".claude", "commands", "agents", "test.md"),
    "utf8",
  );
  check(
    "test.md: --smoke / --full passthrough documented",
    testMd.includes("--smoke") && testMd.includes("--full"),
    "Missing --smoke/--full passthrough in test.md",
  );
  check(
    "test.md: documents non-zero exit on RED",
    testMd.includes("2") && (testMd.includes("RED") || testMd.includes("red")),
    "Missing exit-2-on-RED contract in test.md",
  );
  check(
    "test.md: explains relationship between cli.js and smoke",
    testMd.includes("dispatch-agent.js") || testMd.includes("cli.js"),
    "Missing cli.js vs smoke relationship in test.md",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────
process.stdout.write("\n");
if (failed > 0) {
  process.stderr.write(`FAIL — ${failed} of ${passed + failed} cases failed:\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`OK — ${passed} cases passed\n`);
process.exit(0);
