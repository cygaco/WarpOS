#!/usr/bin/env node
"use strict";

/**
 * conformance-matrix.js — G0.3: the kernel conformance runner (SP-20260718-001
 * Phase 0). Reads `.claude/kernel/support-matrix.json` (D4) +
 * `.claude/kernel/fixtures/**` (D6), EXECUTES each kernel-conformance fixture
 * through a small per-gate pure evaluator, and compares the computed outcome
 * to the fixture's `expect.outcome`.
 *
 * The `.claude/kernel/fixtures/contract-lint/` directory is EXCLUDED from this
 * runner by design — it is contract-lint.js's (G0.1's) own R1 self-test corpus
 * (contract-shaped .md documents fed to the LINTER, not {input,expect}
 * kernel-conformance cases evaluated against role-binding.json/
 * support-matrix.json). See fixtures/manifest.json's
 * `_contract_lint_selftest_note`.
 *
 * REPORT-ONLY through Phase 2 under ED-214 — a mismatch or a `down` required
 * lane never fails a build/gate by default. BINDING (`--enforce`) flips at
 * RATIFIED-PLAN Phase-3 exit: exits 1 on ANY fixture mismatch OR any
 * `required:true` support-matrix row resolving `status:"down"` (a down
 * required lane is BLOCKED-not-green regardless of whether a fixture
 * "correctly predicted" it — R4).
 *
 * `--coverage` asserts R3 positive coverage: >=1 fixture bound (`bound_core`)
 * per CORE invariant (CORE-1..4) AND >=1 fixture bound (`bound_matrix_cell`)
 * per in-kernel-scope support-matrix helm row.
 *
 * Exit contract (mirrors log-sink-caps.js / contract-lint.js):
 *   0  no flags: report-only, always 0 unless a runner error occurred.
 *      --enforce: 0 = no mismatches AND no down-required-lane.
 *      --coverage: 0 = full R3 coverage.
 *   1  --enforce: a mismatch or a down-required-lane was found.
 *      --coverage: a CORE invariant or in-kernel matrix cell has zero bound fixtures.
 *   2  runner error — fail-closed, distinct from a clean 0. Covers: missing/
 *      unreadable/unparseable support-matrix.json; a support-matrix that
 *      parses as JSON but is STRUCTURALLY invalid (missing/invalid `rows`, or
 *      a row missing a required field — B-3); an unreadable fixtures dir; or
 *      a SEMANTICALLY malformed fixture file — unparseable JSON, missing
 *      required fields, an unrecognized `gate` name with no registered
 *      evaluator, or a non-canonical `expect.outcome` (B-2). A fixture/matrix
 *      the runner CANNOT decide is always fail-closed, never a reportable
 *      mismatch or a silent pass.
 *
 *   node scripts/checks/conformance-matrix.js [--report-only|--enforce] [--coverage] [--json]
 */

const fs = require("fs");
const path = require("path");

/**
 * ROOT resolution anchors on __dirname FIRST (see contract-lint.js's
 * resolveRoot() for the full rationale — ED-016 "AGENT_ROOT=__dirname/.."
 * precedent: a session's CLAUDE_PROJECT_DIR can be stale/point at a
 * different checkout than the one this script physically lives in).
 */
function resolveRoot() {
  const anchor = path.resolve(__dirname, "..", "..");
  if (fs.existsSync(path.join(anchor, ".claude"))) return anchor;
  const envRoot = process.env.CLAUDE_PROJECT_DIR;
  if (envRoot && fs.existsSync(path.join(envRoot, ".claude"))) return envRoot;
  return anchor;
}

const ROOT = resolveRoot();
const NAME = "conformance-matrix";

const KERNEL_DIR = path.join(ROOT, ".claude", "kernel");
const SUPPORT_MATRIX_PATH = path.join(KERNEL_DIR, "support-matrix.json");
const FIXTURES_DIR = path.join(KERNEL_DIR, "fixtures");
const MANIFEST_PATH = path.join(FIXTURES_DIR, "manifest.json");

// contract-lint.js's OWN R1 self-test corpus — never a kernel-conformance gate.
const EXCLUDED_GATE_DIRS = new Set(["contract-lint"]);

const REQUIRED_CORE_IDS = ["CORE-1", "CORE-2", "CORE-3", "CORE-4"];

// ── Per-gate pure evaluators — the Phase-0 SEED reasoning layer. Each maps a
// fixture's `input` to a computed {outcome, reason}. Deliberately small and
// literal: the LIVE runtime enforcement of these rules is Phase 1-4 work
// (see the ED-215/216/217 Deferred trailers in top-level-runtime-contract.md);
// this is what lets G0.3 "execute" a fixture rather than merely schema-check it.
const GATE_EVALUATORS = {
  "role-binding": (input, ctx) => {
    const rb = ctx.roleBinding || {};
    if (input.actor_kind === "dispatched_worker") {
      const bound =
        input.explicit_user_instruction ||
        input.validated_workorder_or_cli_binding ||
        input.explicit_top_level_helm_binding;
      if (!bound) {
        return {
          outcome: (rb.worker_default_when_unbound === "FAIL_CLOSED" ? "BLOCK" : "PASS"),
          reason: "unbound dispatched worker; worker_default_when_unbound governs",
        };
      }
      return { outcome: "PASS", reason: "role resolved through the precedence order" };
    }
    if (input.attempted_binding_source) {
      const src = (rb.sources && rb.sources[input.attempted_binding_source]) || {};
      return {
        outcome: src.can_bind ? "PASS" : "BLOCK",
        reason: `sources.${input.attempted_binding_source}.can_bind = ${!!src.can_bind}`,
      };
    }
    return { outcome: "BLOCK", reason: "unrecognized role-binding input shape (fail-closed)" };
  },

  // C-2 [DISPOSITIONED, security-Claude]: this seed only evaluates
  // `integrate_to_main`, ONE of CORE-2's four named powers (§1/§7 P7.2:
  // capability grants, protected mutation, verification, integration-to-main).
  // The other three are DEFINED by the contract but have NO evaluator logic
  // here — that is intentional Phase-0 scope, not a gap: CORE-2's live
  // enforcement mechanism (the pinned trusted checker / atomic CAS integration
  // principal) is RATIFIED-PLAN Phase-4 work (ED-215). This evaluator is a
  // REPORT-ONLY Phase-0 seed for the one power that has a clean binary
  // input shape today; do not read a PASS from this gate as proof that
  // capability-grants/protected-mutation/verification are themselves
  // enforced — they are not, until Phase 4 ships (see fixtures/manifest.json
  // core_coverage.CORE-2's note for the fixture-level restatement).
  "trust-boundary": (input) => {
    if (input.attempted_action === "integrate_to_main" && !input.actor_is_trusted_layer) {
      return { outcome: "BLOCK", reason: "only the provider-independent trusted layer may integrate to main" };
    }
    return { outcome: "PASS", reason: "actor is the trusted layer or is not attempting a boundary power" };
  },

  retention: (input) => {
    if (input.attempted_disposition === "archive") {
      return { outcome: "PASS", reason: "over-cap sink moved to archive, raw history preserved (D-1)" };
    }
    return { outcome: "BLOCK", reason: "any disposition other than 'archive' is refused (D-1: never delete)" };
  },

  "support-matrix": (input, ctx) => {
    const row = ctx.supportMatrix && ctx.supportMatrix.rows && ctx.supportMatrix.rows[input.helm];
    if (!row) return { outcome: "BLOCK", reason: `unknown helm '${input.helm}' (fail-closed)` };
    if (row.status === "down" && row.required) {
      return { outcome: "BLOCK", reason: `required helm '${input.helm}' resolves down (evidence_ref: ${row.evidence_ref})` };
    }
    if (row.status === "supported" && row.proven) {
      return { outcome: "PASS", reason: `helm '${input.helm}' is supported + proven` };
    }
    return { outcome: "BLOCK", reason: `helm '${input.helm}' is neither supported+proven nor a down-required lane (fail-closed on ambiguity)` };
  },

  "dispatch-honesty": (input) => {
    const re = input.result_envelope || {};
    const empty = (arr) => !Array.isArray(arr) || arr.length === 0;
    if (re.status === "passed" && empty(re.files_changed) && empty(re.commits) && empty(re.tests_run) && empty(re.evidence_paths)) {
      return { outcome: "BLOCK", reason: "status:passed claimed with zero files/commits/tests/evidence (false-green)" };
    }
    return { outcome: "PASS", reason: "the envelope carries corroborating evidence for its claimed status" };
  },

  tracker: (input) => {
    if (input.tracker_claim === "done" && input.disk_evidence === "absent" && input.git_evidence === "absent") {
      return { outcome: "BLOCK", reason: "tracker claims done with no corroborating disk/git evidence (drift)" };
    }
    return { outcome: "PASS", reason: "tracker claim is corroborated by disk/git evidence" };
  },

  worktree: (input) => {
    if (input.base_is_ancestor_of_head === false) {
      return { outcome: "BLOCK", reason: "declared base commit is not an ancestor of the integration head (stale base)" };
    }
    return { outcome: "PASS", reason: "declared base commit is fresh against the integration head" };
  },

  workorder: (input) => {
    if (input.role_kind === "feature-build" && input.prompt_bytes < input.floor_bytes) {
      return { outcome: "BLOCK", reason: `prompt_bytes ${input.prompt_bytes} below floor_bytes ${input.floor_bytes}` };
    }
    return { outcome: "PASS", reason: "prompt meets the size floor (or role is not feature-build)" };
  },

  "dispatch-review": (input) => {
    if (input.builder_provider && input.builder_provider === input.reviewer_provider) {
      return { outcome: "BLOCK", reason: "reviewer provider matches builder provider (same-family self-review refused)" };
    }
    return { outcome: "PASS", reason: "reviewer is a different provider family from the builder" };
  },
};

/**
 * B-3: validate support-matrix.json's STRUCTURE, not just its JSON syntax —
 * a syntactically-valid-but-structurally-invalid matrix (missing `rows`,
 * `rows` not an object, a row missing a required field, or a required field
 * with the wrong type) must fail closed, never be silently accepted as if it
 * were a legitimate (possibly-empty) matrix. Mirrors §4/P4.1: "Every row MUST
 * carry {status, required, proven, evidence_ref}." Throws on any violation.
 */
function validateSupportMatrix(matrix, supportMatrixPath) {
  if (!matrix || typeof matrix !== "object" || Array.isArray(matrix)) {
    const err = new Error(`support matrix ${supportMatrixPath} is not a JSON object`);
    err.code = "SUPPORT_MATRIX_SHAPE_ERROR";
    throw err;
  }
  if (!matrix.rows || typeof matrix.rows !== "object" || Array.isArray(matrix.rows)) {
    const err = new Error(
      `support matrix ${supportMatrixPath} missing/invalid 'rows' (must be an object keyed by helm)`,
    );
    err.code = "SUPPORT_MATRIX_SHAPE_ERROR";
    throw err;
  }
  for (const [helm, row] of Object.entries(matrix.rows)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      const err = new Error(`support matrix row '${helm}' is not a JSON object`);
      err.code = "SUPPORT_MATRIX_ROW_SHAPE_ERROR";
      throw err;
    }
    if (typeof row.status !== "string" || !row.status) {
      const err = new Error(`support matrix row '${helm}' missing/invalid 'status' (string)`);
      err.code = "SUPPORT_MATRIX_ROW_SHAPE_ERROR";
      throw err;
    }
    if (typeof row.required !== "boolean") {
      const err = new Error(`support matrix row '${helm}' missing/invalid 'required' (boolean)`);
      err.code = "SUPPORT_MATRIX_ROW_SHAPE_ERROR";
      throw err;
    }
    if (typeof row.proven !== "boolean") {
      const err = new Error(`support matrix row '${helm}' missing/invalid 'proven' (boolean)`);
      err.code = "SUPPORT_MATRIX_ROW_SHAPE_ERROR";
      throw err;
    }
    if (typeof row.evidence_ref !== "string" || !row.evidence_ref) {
      const err = new Error(`support matrix row '${helm}' missing/invalid 'evidence_ref' (string)`);
      err.code = "SUPPORT_MATRIX_ROW_SHAPE_ERROR";
      throw err;
    }
  }
  return matrix;
}

/** Load support-matrix.json. Throws on missing/unparseable/structurally-invalid (fail-closed). */
function loadSupportMatrix(supportMatrixPath) {
  const text = fs.readFileSync(supportMatrixPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const err = new Error(`support matrix ${supportMatrixPath} is not valid JSON: ${(e && e.message) || e}`);
    err.code = "SUPPORT_MATRIX_PARSE_ERROR";
    throw err;
  }
  return validateSupportMatrix(parsed, supportMatrixPath);
}

/** Load role-binding.json (best-effort companion for the role-binding gate). */
function loadRoleBinding(kernelDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(kernelDir, "role-binding.json"), "utf8"));
  } catch {
    return {};
  }
}

// B-2: the closed set of outcomes any GATE_EVALUATORS function can compute —
// a fixture's expect.outcome outside this set can never be matched, so it is
// SEMANTICALLY malformed, not a legitimate (if surprising) expectation.
const VALID_OUTCOMES = new Set(["PASS", "BLOCK"]);

/**
 * Walk `.claude/kernel/fixtures/<gate>/<case>.json`, excluding EXCLUDED_GATE_DIRS
 * and the top-level manifest.json. Throws on a malformed fixture (fail-closed).
 *
 * B-2: a SEMANTICALLY malformed fixture — missing required fields, unparseable
 * JSON, or a gate name with NO registered evaluator — cannot be DECIDED by
 * this runner. It must fail closed here (structural, exit 2 at the CLI),
 * never fall through to evaluate() as a reportable mismatch/PASS.
 */
function loadFixtures(fixturesDir) {
  const fixtures = [];
  let gateDirs;
  try {
    gateDirs = fs.readdirSync(fixturesDir, { withFileTypes: true });
  } catch (e) {
    const err = new Error(`fixtures dir unreadable: ${(e && e.message) || e}`);
    err.code = "FIXTURES_DIR_UNREADABLE";
    throw err;
  }
  for (const entry of gateDirs) {
    if (!entry.isDirectory()) continue; // skip manifest.json (a file, not a dir)
    if (EXCLUDED_GATE_DIRS.has(entry.name)) continue;
    const gateDir = path.join(fixturesDir, entry.name);
    const files = fs.readdirSync(gateDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const full = path.join(gateDir, file);
      let parsed;
      try {
        parsed = JSON.parse(fs.readFileSync(full, "utf8"));
      } catch (e) {
        const err = new Error(`malformed fixture ${full}: ${(e && e.message) || e}`);
        err.code = "FIXTURE_PARSE_ERROR";
        throw err;
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        const err = new Error(`fixture ${full} is not a JSON object`);
        err.code = "FIXTURE_SHAPE_ERROR";
        throw err;
      }
      if (typeof parsed.id !== "string" || !parsed.id) {
        const err = new Error(`fixture ${full} missing required field 'id'`);
        err.code = "FIXTURE_SHAPE_ERROR";
        throw err;
      }
      if (typeof parsed.gate !== "string" || !parsed.gate) {
        const err = new Error(`fixture ${full} missing required field 'gate'`);
        err.code = "FIXTURE_SHAPE_ERROR";
        throw err;
      }
      if (!Object.prototype.hasOwnProperty.call(GATE_EVALUATORS, parsed.gate)) {
        const err = new Error(`fixture ${full} names unknown gate '${parsed.gate}' (no evaluator registered)`);
        err.code = "FIXTURE_UNKNOWN_GATE";
        throw err;
      }
      if (
        !parsed.expect ||
        typeof parsed.expect.outcome !== "string" ||
        !VALID_OUTCOMES.has(parsed.expect.outcome)
      ) {
        const err = new Error(
          `fixture ${full} missing/invalid 'expect.outcome' (must be one of ${[...VALID_OUTCOMES].join("/")})`,
        );
        err.code = "FIXTURE_SHAPE_ERROR";
        throw err;
      }
      fixtures.push({ ...parsed, _file: path.relative(ROOT, full).replace(/\\/g, "/") });
    }
  }
  return fixtures;
}

/**
 * Pure core: execute every fixture through its gate evaluator, compare to
 * expect.outcome. Returns { results:[{id,gate,pass,computed,expected,file}],
 * mismatches:[...], requiredDownLanes:[...] }.
 *
 * B-2: an unknown gate name (no registered evaluator) is a STRUCTURAL error,
 * not a reportable mismatch — this runner cannot DECIDE such a fixture, so it
 * throws (fail-closed) rather than silently recording it as a comparable
 * PASS/BLOCK result. `loadFixtures` already screens file-loaded fixtures for
 * this; this check stays here too so ANY caller of evaluate() — not only the
 * fs-backed loader — gets the same fail-closed guarantee.
 */
function evaluate({ fixtures, supportMatrix, roleBinding }) {
  const ctx = { supportMatrix, roleBinding };
  const results = [];
  const mismatches = [];
  for (const fx of fixtures) {
    const evaluator = GATE_EVALUATORS[fx.gate];
    if (!evaluator) {
      const err = new Error(
        `fixture ${fx.id || fx._file || "<unknown>"} names unknown gate '${fx.gate}' (no evaluator registered) — cannot be decided, fail-closed`,
      );
      err.code = "FIXTURE_UNKNOWN_GATE";
      throw err;
    }
    const computed = evaluator(fx.input || {}, ctx);
    const pass = computed.outcome === fx.expect.outcome;
    const r = {
      id: fx.id,
      gate: fx.gate,
      file: fx._file,
      pass,
      computed: computed.outcome,
      computedReason: computed.reason,
      expected: fx.expect.outcome,
    };
    results.push(r);
    if (!pass) mismatches.push(r);
  }

  const requiredDownLanes = [];
  const rows = (supportMatrix && supportMatrix.rows) || {};
  for (const [helm, row] of Object.entries(rows)) {
    if (row && row.required && row.status === "down") {
      requiredDownLanes.push({ helm, evidence_ref: row.evidence_ref });
    }
  }

  return { results, mismatches, requiredDownLanes };
}

/** R3 coverage check: >=1 fixture per CORE invariant + per in-kernel support-matrix row. */
function evaluateCoverage({ fixtures, supportMatrix }) {
  const coreCoverage = {};
  for (const id of REQUIRED_CORE_IDS) coreCoverage[id] = 0;
  const cellCoverage = {};
  const rows = (supportMatrix && supportMatrix.rows) || {};
  for (const helm of Object.keys(rows)) cellCoverage[helm] = 0;

  for (const fx of fixtures) {
    if (fx.bound_core && Object.prototype.hasOwnProperty.call(coreCoverage, fx.bound_core)) {
      coreCoverage[fx.bound_core] += 1;
    }
    if (fx.bound_matrix_cell && Object.prototype.hasOwnProperty.call(cellCoverage, fx.bound_matrix_cell)) {
      cellCoverage[fx.bound_matrix_cell] += 1;
    }
  }

  const gaps = [];
  for (const [id, count] of Object.entries(coreCoverage)) {
    if (count === 0) gaps.push({ kind: "core", id });
  }
  for (const [cell, count] of Object.entries(cellCoverage)) {
    if (count === 0) gaps.push({ kind: "matrix_cell", id: cell });
  }
  return { ok: gaps.length === 0, coreCoverage, cellCoverage, gaps };
}

/** fs-backed runner. Throws on any runner-level error (fail-closed, exit 2 at the CLI). */
function run(opts) {
  opts = opts || {};
  const kernelDir = opts.kernelDir || KERNEL_DIR;
  const supportMatrixPath = opts.supportMatrixPath || SUPPORT_MATRIX_PATH;
  const fixturesDir = opts.fixturesDir || FIXTURES_DIR;

  const supportMatrix = loadSupportMatrix(supportMatrixPath);
  const roleBinding = loadRoleBinding(kernelDir);
  const fixtures = loadFixtures(fixturesDir);

  const { results, mismatches, requiredDownLanes } = evaluate({ fixtures, supportMatrix, roleBinding });
  const coverage = evaluateCoverage({ fixtures, supportMatrix });

  let manifestCount;
  try {
    manifestCount = JSON.parse(fs.readFileSync(opts.manifestPath || MANIFEST_PATH, "utf8")).count;
  } catch {
    manifestCount = undefined;
  }

  return { results, mismatches, requiredDownLanes, coverage, fixtureCount: fixtures.length, manifestCount };
}

module.exports = { evaluate, evaluateCoverage, loadFixtures, loadSupportMatrix, loadRoleBinding, run, GATE_EVALUATORS };

if (require.main === module) {
  const argv = process.argv.slice(2);
  const JSON_OUT = argv.includes("--json");
  const ENFORCE = argv.includes("--enforce");
  const COVERAGE = argv.includes("--coverage");

  let res;
  try {
    res = run();
  } catch (e) {
    const msg = (e && e.message) || e;
    if (JSON_OUT) console.log(JSON.stringify({ ok: false, error: String(msg) }));
    else console.error(`[${NAME}] runner error (fail-closed): ${msg}`);
    process.exit(2);
  }

  if (COVERAGE) {
    const { coverage } = res;
    if (JSON_OUT) {
      console.log(JSON.stringify({ check: NAME, mode: "coverage", ...coverage }));
    } else if (coverage.ok) {
      console.log(`OK   [${NAME}] --coverage: every CORE invariant + in-kernel matrix cell has >=1 bound fixture`);
    } else {
      console.error(`FAIL [${NAME}] --coverage: ${coverage.gaps.length} uncovered:`);
      for (const g of coverage.gaps) console.error(`  - ${g.kind}: ${g.id}`);
    }
    process.exit(coverage.ok ? 0 : 1);
  }

  const hasMismatch = res.mismatches.length > 0;
  const hasRequiredDown = res.requiredDownLanes.length > 0;
  const binding = ENFORCE && (hasMismatch || hasRequiredDown);

  if (JSON_OUT) {
    console.log(
      JSON.stringify({
        check: NAME,
        mode: ENFORCE ? "enforce" : "report-only",
        fixtureCount: res.fixtureCount,
        manifestCount: res.manifestCount,
        mismatches: res.mismatches,
        requiredDownLanes: res.requiredDownLanes,
      }),
    );
  } else {
    console.log(
      `[${NAME}] ${ENFORCE ? "ENFORCE" : "REPORT-ONLY (ED-214)"} — ${res.fixtureCount} fixture(s) executed, ` +
        `${res.mismatches.length} mismatch(es), ${res.requiredDownLanes.length} required-down lane(s)`,
    );
    for (const m of res.mismatches) {
      console.error(`  - MISMATCH ${m.id} (${m.gate}): expected ${m.expected}, computed ${m.computed}`);
    }
    for (const d of res.requiredDownLanes) {
      console.error(`  - REQUIRED-DOWN ${d.helm}: ${d.evidence_ref}`);
    }
    if (!ENFORCE && (hasMismatch || hasRequiredDown)) {
      console.error(`[${NAME}] report-only (ED-214) — re-run with --enforce to make this a blocking gate.`);
    }
    if (res.fixtureCount === 0) {
      console.error(`[${NAME}] WARNING: zero fixtures executed.`);
    }
  }

  process.exit(ENFORCE ? (binding ? 1 : 0) : 0);
}
