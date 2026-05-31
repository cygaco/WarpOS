#!/usr/bin/env node
"use strict";

/**
 * pl-build-spec-enforcer (S2.1, Wave-2 Engineering enforcer) — the
 * **Product-Lead-as-enforcer** for oneshot `build_spec` validation. In a oneshot
 * run there is no α/β in the room (decision_record clean-room invariant), so the
 * PL's "is this buildable truth, and does it derive from the spine?" judgment must
 * be a fail-closed GATE, not a ceremonial review.
 *
 * Design notes it builds to:
 *   - runtime/notes/wave2-s2.1-qa-lead-rename-and-routing.md (PL-as-enforcer / routing)
 *   - schemas/contracts/build_spec.schema.json (the contract it validates against,
 *     precedence 70 — "what's built is ground truth", highest in the chain)
 *
 * It wraps the existing contract validator (scripts/contracts/validate-artifact.js,
 * REUSED — never re-implements schema checking) on a build_spec PLUS its required
 * upstream artifacts, and adds the PL-specific upstream-presence + spine-coherence
 * judgment the bare validator does not own.
 *
 * REJECTS (exit 1), never lints:
 *   1. CONTRACT — the build_spec (or its chain) violates the contract: unknown type,
 *      missing required field, type/const mismatch, precedence conflict, dangling
 *      message_brief reference (delegated to validateChain).
 *   2. MISSING-UPSTREAM — a build_spec present WITHOUT its required upstream in the
 *      chain. build_spec derives from the message_brief (the spine) and realizes the
 *      design_brief (FINAL-PLAN §2 / contract-first-construction); a build_spec with
 *      no message_brief in the chain, or whose `derived_from_message_brief` points at
 *      no present message_brief, is not buildable truth — REJECT.
 *   3. WRONG-INPUT — input contains no build_spec at all (the enforcer was pointed at
 *      the wrong artifact) ⇒ fail-closed reject (never silently green on a no-op).
 *
 * EMIT (arbitration, fail-closed park) — when it CANNOT confidently resolve:
 *   - DESIGN-CONFLICT — a design_brief is present but its `derived_from_message_brief`
 *     disagrees with the build_spec's (two upstreams claim different spines): the PL
 *     can't pick the winner alone ⇒ emit() arbitration_needed (NOT a guessed pass).
 *   - LOW-CONFIDENCE — the build_spec validates but a required design_brief upstream is
 *     ABSENT from the chain. Per the contract a build_spec realizes a design_brief; its
 *     absence is a coherence gap the PL flags for arbitration rather than green-lighting.
 *   artifactPrecedence is the build_spec's rank (70) so the resolver orders this
 *   concern correctly in the per-unit bundle (β ADR delta).
 *
 * Internal error => exit 2 (fail-closed: an enforcer that errors must never read green).
 *
 * Pure core = evaluate({ items, validateChain, reg }) (injected seams) so the bite-test
 * proves each reject/emit class without disk or a real chain file. Mirrors
 * scripts/checks/role-parity-scan.js (pure evaluate + injectable seams + sibling .test.js).
 *
 *   node scripts/checks/pl-build-spec-enforcer.js <chain.json> [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "pl-build-spec-enforcer";
const OWNER = "product_lead";

/** Normalize a single artifact / array / { chain:[...] } into an items array. */
function toItems(input) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.chain)) return input.chain;
  return [input];
}

/**
 * Pure assertion core.
 * @param {object[]} items        the artifact chain (already normalized)
 * @param {function} validateChain (items, reg) => { ok, errors[] } — injected from validate-artifact
 * @param {object}   reg          loaded schema registry (injected)
 * @returns {{ errors: string[], emits: Array<{reason,decision,rationale,confidence,precedenceBasis,artifactPrecedence}> }}
 *   errors[] => hard REJECT (exit 1). emits[] => fail-closed arbitration parks (emit()).
 */
function evaluate({ items, validateChain, reg }) {
  const errors = [];
  const emits = [];

  // 1. CONTRACT — delegate the schema/precedence/spine checks to the reused validator.
  const chainResult = validateChain(items, reg);
  for (const e of chainResult.errors) errors.push(`contract: ${e}`);

  const buildSpecs = items.filter((it) => it && it.type === "build_spec");
  const messageBriefs = items.filter((it) => it && it.type === "message_brief");
  const designBriefs = items.filter((it) => it && it.type === "design_brief");
  const mbIds = new Set(messageBriefs.map((m) => m.id));
  // build_spec's own contract precedence (70) — the rank this enforcer's concern carries.
  const bsPrecedence =
    (reg && reg.build_spec && reg.build_spec.contract && reg.build_spec.contract.precedence) || 70;

  // 3. WRONG-INPUT — pointed at something with no build_spec at all.
  if (buildSpecs.length === 0) {
    errors.push(
      "missing-upstream: no build_spec present in the input — the PL enforcer was pointed at a chain with nothing to build (fail-closed, not a no-op pass)",
    );
    return { errors, emits };
  }

  for (const bs of buildSpecs) {
    const ref = bs.derived_from_message_brief;

    // 2. MISSING-UPSTREAM — the spine must be present for this build_spec.
    if (messageBriefs.length === 0) {
      errors.push(
        `missing-upstream: build_spec#${bs.id || "(no id)"} has no message_brief (the spine) present in the chain — not buildable truth (contract-first-construction)`,
      );
    } else if (typeof ref === "string" && ref && !mbIds.has(ref)) {
      // dangling spine ref is also caught by validateChain; we restate it as a
      // PL-owned missing-upstream so the reject reason is unambiguous to the operator.
      errors.push(
        `missing-upstream: build_spec#${bs.id || "(no id)"} derives from message_brief '${ref}' which is absent from the chain (dangling spine)`,
      );
    }

    // DESIGN-CONFLICT (emit) — a design_brief present, but it claims a DIFFERENT spine.
    // The PL cannot unilaterally pick which upstream wins => fail-closed arbitration.
    for (const db of designBriefs) {
      const dbRef = db.derived_from_message_brief;
      if (
        typeof ref === "string" && ref &&
        typeof dbRef === "string" && dbRef &&
        dbRef !== ref
      ) {
        emits.push({
          reason: "design-conflict",
          decision: `park: build_spec#${bs.id} and design_brief#${db.id} disagree on the spine`,
          rationale: `build_spec derives from message_brief '${ref}' but design_brief#${db.id} derives from '${dbRef}'; two upstreams claim different spines and the Product Lead cannot pick the winner alone (precedence: build_spec 70 > design_brief 30, but a contradicted upstream is a coherence defect, not an override license)`,
          confidence: 0.3,
          precedenceBasis: "build_spec(70) > design_brief(30); contradicted upstream => arbitration",
          artifactPrecedence: bsPrecedence,
        });
      }
    }

    // LOW-CONFIDENCE (emit) — validates, spine present, but NO design_brief upstream.
    // build_spec realizes a design_brief (contract consumers/precedence); its absence is
    // a coherence gap the PL flags rather than green-lighting a build with no design intent.
    if (
      designBriefs.length === 0 &&
      messageBriefs.length > 0 &&
      !(typeof ref === "string" && ref && !mbIds.has(ref)) // not already a missing-upstream reject
    ) {
      emits.push({
        reason: "low-confidence-no-design-brief",
        decision: `park: build_spec#${bs.id} has no design_brief upstream to realize`,
        rationale: `build_spec validates against the contract and its spine is present, but no design_brief is in the chain for it to realize (design_brief is a declared consumer-of-message_brief that build_spec consumes); the Product Lead flags this coherence gap for arbitration rather than certifying a build with no design intent`,
        confidence: 0.4,
        precedenceBasis: "design_brief(30) is a declared upstream of build_spec(70)",
        artifactPrecedence: bsPrecedence,
      });
    }
  }

  return { errors, emits };
}

function main(argv) {
  const json = argv.includes("--json");
  const file = argv.slice(2).find((a) => !a.startsWith("--"));
  if (!file) {
    process.stderr.write("usage: pl-build-spec-enforcer.js <chain.json> [--json]\n");
    return 2; // fail-closed (no input is not a pass)
  }

  let result, emitted;
  try {
    const { loadSchemas, validateChain, DEFAULT_SCHEMAS_DIR } = require(
      path.join(ROOT, "scripts/contracts/validate-artifact.js"),
    );
    const { emit } = require(path.join(ROOT, "scripts/arbitration/emit.js"));
    const reg = loadSchemas(DEFAULT_SCHEMAS_DIR);
    const input = JSON.parse(fs.readFileSync(path.resolve(file), "utf8").replace(/^﻿/, ""));
    const items = toItems(input);
    result = evaluate({ items, validateChain, reg });

    // Fire the arbitration parks (the escalation path — never reimplement decision_record writing).
    emitted = [];
    const unit = items.find((it) => it && it.type === "build_spec" && it.id)
      ? items.find((it) => it && it.type === "build_spec" && it.id).id
      : path.basename(file);
    for (const e of result.emits) {
      emitted.push(
        emit({
          unit,
          owner: OWNER,
          decision: e.decision,
          rationale: e.rationale,
          confidence: e.confidence,
          precedenceBasis: e.precedenceBasis,
          // FAIL-CLOSED: omit arbitrationNeeded ⇒ true (β Q2). Do NOT pass false here.
          artifactPrecedence: e.artifactPrecedence,
        }),
      );
    }
  } catch (e) {
    process.stderr.write(`${NAME} error: ${e.message}\n`);
    return 2; // fail-closed
  }

  const { errors, emits } = result;
  const rejected = errors.length > 0;
  const parked = emits.length > 0;

  if (json) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: !rejected && !parked,
          check: NAME,
          owner: OWNER,
          rejected,
          parked,
          errors,
          arbitration: emitted.map((r) => ({ id: r.id, unit: r.unit, decision: r.decision })),
        },
        null,
        2,
      ) + "\n",
    );
    return rejected ? 1 : parked ? 1 : 0;
  }

  if (rejected) {
    process.stderr.write(
      `REJECT [${NAME}] build_spec failed Product-Lead enforcement (${errors.length}):\n${errors.map((e) => "  - " + e).join("\n")}\n`,
    );
    return 1;
  }
  if (parked) {
    process.stderr.write(
      `ARBITRATION [${NAME}] build_spec parked for arbitration (${emits.length}) — NOT ship-ready until α/β resolve:\n${emits.map((e) => "  ▸ " + e.decision + " :: " + e.rationale.slice(0, 140)).join("\n")}\n  (emitted to runtime/arbitration; the resolver gate will block ship-ready)\n`,
    );
    return 1; // a parked unit is NOT a pass
  }
  process.stdout.write(`OK   [${NAME}] build_spec is buildable truth (contract valid + spine + design intent present)\n`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, toItems, NAME, OWNER };
