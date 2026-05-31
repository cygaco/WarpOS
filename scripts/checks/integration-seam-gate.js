#!/usr/bin/env node
"use strict";

/**
 * /scan:integration-seam — the acceptance gate for the **Gamma integration phase**
 * (S1.3, FINAL-PLAN §6 Wave 1 + §7 default #2). Gamma OWNS an explicit phase that
 * runs AFTER the FE + BE builders return and BEFORE the gauntlet clears a
 * multi-builder feature, so the FE↔BE seam is governed BEFORE the pilot discovers
 * shared-file pain (§8 top-risk: "FE/BE integration on shared files"). This is the
 * enforcer that makes the phase REJECT (not lint).
 *
 * Mirrors scripts/checks/role-parity-scan.js exactly: a pure `evaluate()` core given
 * injected seams (so the negative bite-test can prove it rejects each class) + a CLI
 * (`--json`, exit 0/1/2 fail-closed). An enforcer without a bite-test is a false-green
 * waiting to happen.
 *
 * INPUT — a per-feature integration manifest (the multi-builder integration surface),
 * written per-run by the orchestrator to runtime/integration/<feature>/manifest.json
 * (walk-skipped, NOT tracked — per-run artifacts go under runtime/, never
 * .claude/project/). Shape v0.1 in runtime/notes/wave2-s1.3-gamma-integration-phase.md.
 *
 * REJECTS (exit 1), never lints, when ANY (each has a bite-test):
 *   1. shared-file-unreconciled    — a shared file edited by >=2 distinct builders with
 *                                    no reconciliation record (own-the-integration-seam);
 *   2a. consumed-type-no-producer  — an FE-consumed type with no BE producer;
 *   2b. type-shape-mismatch        — an FE-consumed type whose shape != the BE-produced
 *                                    shape (shape_match flag, or an injected typeShapeResolver);
 *   3. seam-contract-missing-field — a declared seam contract (env/data) missing a
 *                                    required field;
 *   4. smoke-test-absent           — a multi-builder feature with no FE<->BE boundary
 *                                    smoke test (or a declared path that doesn't resolve,
 *                                    when a smokeResolver is injected);
 *   5. merge-order-incoherent      — a merge plan that can't be executed (omits a builder
 *                                    that edited a shared file, or names an unknown builder).
 *
 * N/A: builders.length < 2 => nothing to integrate => exit 0 (applicable:false).
 * Malformed manifest (not an object / missing feature|builders) => exit 2 (fail-closed:
 * a gate that errors must never read green).
 *
 * ARBITRATION (oneshot, no alpha/beta): on UNRESOLVED conflict in mode "oneshot",
 * `--emit-on-conflict` calls scripts/arbitration/emit.js#emit() with owner
 * "gamma_integration" + artifactPrecedence = build_spec.precedence (70 — the seam is
 * governed by what is actually built; highest in the chain so the integration concern
 * leads its per-unit bundle). The existing run-end resolver then blocks ship-ready. We
 * REUSE S1.2's emit — we do not reimplement decision_record writing.
 *
 *   node scripts/checks/integration-seam-gate.js <manifest.json> [--json] [--emit-on-conflict]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "integration-seam";

// build_spec.precedence from schemas/contracts/build_spec.schema.json — the seam is
// governed by what is actually built (producer/BE shape leads). Read live so a contract
// re-rank propagates; fall back to the known v0.1 rank if the schema is unreadable.
function buildSpecPrecedence() {
  try {
    const s = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "schemas", "contracts", "build_spec.schema.json"),
        "utf8",
      ).replace(/^﻿/, ""),
    );
    const p = s && s.contract && s.contract.precedence;
    return typeof p === "number" ? p : 70;
  } catch {
    return 70; // known v0.1 rank
  }
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
}

/** distinct non-empty values */
function distinct(arr) {
  return [...new Set((arr || []).filter(Boolean))];
}

/**
 * Pure assertion core. Returns { applicable, errors[] } (errors empty = seam holds).
 * Throws on a malformed manifest (=> CLI maps to exit 2, fail-closed).
 *
 * @param manifest          the integration manifest object
 * @param typeShapeResolver optional (contract) => bool|null — true=shapes match,
 *                          false=mismatch, null/undefined=unknown (defer to shape_match
 *                          flag). Injectable so the bite-test controls it.
 * @param smokeResolver     optional (smokePath) => bool — does the smoke test resolve?
 *                          Injectable; when absent the gate trusts a non-empty smoke_test.
 */
function evaluate({ manifest, typeShapeResolver, smokeResolver } = {}) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("integration manifest is not an object");
  }
  if (!manifest.feature || !Array.isArray(manifest.builders)) {
    throw new Error("integration manifest missing required `feature` / `builders[]`");
  }

  const builders = distinct(manifest.builders);
  // N/A short-circuit: a single-builder feature has nothing to integrate.
  if (builders.length < 2) {
    return { applicable: false, errors: [] };
  }

  const errors = [];
  const builderSet = new Set(builders);

  // 1. shared files edited by >1 distinct builder must be reconciled.
  const sharedReconciledBy = new Set(); // builders that did reconcile work (for merge check)
  for (const sf of manifest.shared_files || []) {
    const editors = distinct(sf.edited_by);
    if (editors.length >= 2) {
      const reconciled =
        sf.reconciled_by &&
        String(sf.reconciled_by).trim() &&
        sf.reconciliation &&
        String(sf.reconciliation).trim();
      if (!reconciled) {
        errors.push(
          `shared-file-unreconciled: "${sf.path}" edited by ${editors.join(" + ")} has no reconciliation record (reconciled_by + reconciliation) — own-the-integration-seam`,
        );
      }
    }
    for (const e of editors) sharedReconciledBy.add(e);
  }

  // 2. generated types: producer defines the shape; consumer adapts.
  for (const tc of manifest.type_contracts || []) {
    const consumers = distinct(tc.consumed_by);
    if (consumers.length === 0) continue; // a produced-but-unconsumed type is not a seam defect
    if (!tc.produced_by || !String(tc.produced_by).trim()) {
      errors.push(
        `consumed-type-no-producer: type "${tc.name}" is consumed by ${consumers.join(", ")} but no producer (produced_by) defines its shape`,
      );
      continue; // can't compare a shape with no producer
    }
    // shape match: an injected resolver wins; else trust the manifest's shape_match flag.
    let resolved = null;
    if (typeof typeShapeResolver === "function") {
      try {
        resolved = typeShapeResolver(tc);
      } catch {
        resolved = false; // a resolver that errors is treated as a mismatch (fail-closed)
      }
    }
    const matches = resolved === null ? tc.shape_match === true : resolved === true;
    if (!matches) {
      errors.push(
        `type-shape-mismatch: FE-consumed type "${tc.name}" does not match the ${tc.produced_by}-produced shape (consumer must adapt to producer)`,
      );
    }
  }

  // 3. env / data seam contracts present + consistent.
  for (const sc of manifest.seam_contracts || []) {
    const required = distinct(sc.required_fields);
    const present = new Set(distinct(sc.present_fields));
    for (const field of required) {
      if (!present.has(field)) {
        errors.push(
          `seam-contract-missing-field: seam contract "${sc.name}" (${sc.kind || "?"}) is missing required field "${field}"`,
        );
      }
    }
  }

  // 4. multi-builder feature needs an FE<->BE boundary smoke test.
  const smoke = manifest.smoke_test && String(manifest.smoke_test).trim();
  if (!smoke) {
    errors.push(
      `smoke-test-absent: multi-builder feature "${manifest.feature}" declares no FE<->BE boundary smoke test (smoke_test)`,
    );
  } else if (typeof smokeResolver === "function" && !smokeResolver(smoke)) {
    errors.push(
      `smoke-test-absent: declared smoke test "${smoke}" does not resolve on disk`,
    );
  }

  // 5. merge plan must be executable.
  const merge = manifest.merge || {};
  const order = distinct(merge.order);
  if (order.length) {
    for (const m of order) {
      if (!builderSet.has(m)) {
        errors.push(
          `merge-order-incoherent: merge.order names "${m}" which is not one of this feature's builders [${builders.join(", ")}]`,
        );
      }
    }
    // every builder that touched a shared file must appear in the merge order.
    for (const editor of sharedReconciledBy) {
      if (!order.includes(editor)) {
        errors.push(
          `merge-order-incoherent: "${editor}" edited a shared file but is absent from merge.order [${order.join(", ")}] — its changes would not be merged`,
        );
      }
    }
  }

  return { applicable: true, errors };
}

/**
 * Park an UNRESOLVED oneshot conflict via S1.2's emit (no reimplemented record writing).
 * Returns the written decision_record, or null in adhoc / when not emitting.
 */
function parkIfOneshot({ manifest, errors, emitFn }) {
  if (!errors.length) return null;
  if (manifest.mode !== "oneshot") return null; // adhoc has live alpha/beta — surface, don't park
  const emit = emitFn || require(path.join(ROOT, "scripts", "arbitration", "emit.js")).emit;
  return emit({
    unit: manifest.feature,
    owner: "gamma_integration",
    decision: `integration seam unresolved for "${manifest.feature}" (${errors.length} reject(s))`,
    rationale: errors.join(" | "),
    precedenceBasis: `build_spec.precedence=${buildSpecPrecedence()} (producer/BE shape leads; own-the-integration-seam)`,
    artifactPrecedence: buildSpecPrecedence(),
    // arbitrationNeeded omitted => defaults TRUE (beta Q2 fail-closed: uncertain => park)
  });
}

function main(argv) {
  const json = argv.includes("--json");
  const emitOnConflict = argv.includes("--emit-on-conflict");
  const manifestPath = argv.slice(2).find((a) => !a.startsWith("--"));

  if (!manifestPath) {
    process.stderr.write(
      `${NAME}: usage: node scripts/checks/integration-seam-gate.js <manifest.json> [--json] [--emit-on-conflict]\n`,
    );
    return 2; // fail-closed: no input is not "green"
  }

  let manifest, result;
  try {
    manifest = readJSON(path.resolve(ROOT, manifestPath));
    result = evaluate({ manifest });
  } catch (e) {
    process.stderr.write(`${NAME}-gate error: ${e.message}\n`);
    return 2; // fail-closed (malformed manifest / unreadable / internal)
  }

  const { applicable, errors } = result;

  // Oneshot parking (only when asked, so a dry --json run is side-effect-free).
  let parked = null;
  if (emitOnConflict && errors.length) {
    try {
      parked = parkIfOneshot({ manifest, errors });
    } catch (e) {
      process.stderr.write(`${NAME}-gate arbitration emit failed: ${e.message}\n`);
      return 2; // an enforcer that can't park its fail-closed result must not read green
    }
  }

  if (json) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: errors.length === 0,
          check: NAME,
          feature: manifest.feature,
          mode: manifest.mode || "adhoc",
          applicable,
          errors,
          parked_arbitration: parked ? parked.id : null,
        },
        null,
        2,
      ) + "\n",
    );
    return errors.length ? 1 : 0;
  }

  if (!applicable) {
    process.stdout.write(
      `OK   [${NAME}] feature "${manifest.feature}" is single-builder — integration phase N/A\n`,
    );
    return 0;
  }
  if (errors.length === 0) {
    process.stdout.write(
      `OK   [${NAME}] feature "${manifest.feature}" FE<->BE seam governed (shared files reconciled, types match, seam contracts complete, smoke present, merge coherent)\n`,
    );
    return 0;
  }
  process.stderr.write(
    `FAIL [${NAME}] integration seam REJECTED for "${manifest.feature}" (${errors.length}):\n${errors.map((e) => `  - ${e}`).join("\n")}\n`,
  );
  if (parked) {
    process.stderr.write(
      `  ▸ oneshot: parked for arbitration as ${parked.id} (owner gamma_integration, @prec ${parked.artifact_precedence}) — run-end resolver blocks ship-ready until alpha/beta resolve.\n`,
    );
  } else if (manifest.mode === "oneshot") {
    process.stderr.write(
      `  ▸ oneshot: re-run with --emit-on-conflict to park this for the run-end arbitration resolver (no alpha/beta in the room).\n`,
    );
  } else {
    process.stderr.write(
      `  ▸ adhoc: surface to alpha (live alpha/beta) — treat as a blocking gauntlet failure; fixer/re-builder, max 3.\n`,
    );
  }
  return 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, parkIfOneshot, buildSpecPrecedence, NAME };
