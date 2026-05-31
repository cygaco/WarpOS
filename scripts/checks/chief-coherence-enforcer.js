#!/usr/bin/env node
"use strict";

/**
 * chief-coherence-enforcer (S2.2 Marketing enforcer) — the Copy-Lead's
 * **editor-in-chief gate** + **no-invented-data** check, made self-detecting. In
 * oneshot there is no α/β to break a tie, so the `chief-coherence` discipline
 * (registry slug, rooted on copy-lead) and the `no-invented-data` rule (rooted on
 * research-insight-lead, sharpening base `evidence-over-invention`) must REJECT a
 * non-conformant copy artifact, not warn about it.
 *
 * Builds to runtime/notes/wave2-s2.2-enforcers-design.md §2 (chiefing / no-invented-data
 * table) + the resonance rubric's objection-handling dimension (belief rules).
 *
 * Consumes a "copy artifact" object (advertorial / landing copy / message_brief-backed
 * copy). Expected shape (additive, fail-closed on absence of the review):
 *   {
 *     "type": "advertorial" | "landing_page" | "copy" | ...,
 *     "id": "...",
 *     "body": "<the rendered copy text>",                 // chiefing reads this
 *     "readability_grade": <number>,                       // greased-slide floor (<=8)
 *     "necessary_beliefs": ["I believe that ...", ...],    // <=6, each in form
 *     "images": [{ "role": "proof" | "decorative" | ... }],// no decorative
 *     "claims": [{ "text": "...", "source": "..." | null, "synthetic": true|false,
 *                  "metric": true|false }],                 // no-invented-data
 *     "market_promise": "...",                              // claims-boundary
 *     "offer_verifiable_claim": "...",                      // the product-backed ceiling
 *     "chief_review": { "reviewed": true, "references":     // the editor-in-chief artifact
 *        ["avatar","offer_brief","research","necessary_beliefs"] }
 *   }
 *
 * REJECTS (exit 1), never lints:
 *   - NO-CHIEF-REVIEW   — copy marked done with no chief_review artifact, or one that does
 *                         not reference avatar + offer_brief + research + necessary_beliefs
 *                         (chiefing as aspiration, not a gate). [chief-coherence]
 *   - READABILITY       — readability_grade > 8 (greased-slide / clarity floor). [chief-coherence]
 *   - BELIEF-COUNT      — > 6 necessary beliefs. [chief-coherence]
 *   - BELIEF-FORM       — a belief not in `^I believe that…` form. [chief-coherence]
 *   - DECORATIVE-IMAGE  — an image whose role is "decorative" (no decorative images). [chief-coherence]
 *   - POWER-WORD        — power-word stuffing standing in for argument: ALL-CAPS runs, high
 *                         `!` density, or "discover the secret"-class phrasing. [copy-over-creative]
 *   - INVENTED-DATA     — a claim that is a metric/statistic with NO source AND not labelled
 *                         synthetic:true (fabricated data masquerading as observed). [no-invented-data]
 *   - CLAIMS-BOUNDARY   — a market_promise present whose wording exceeds the linked
 *                         offer_verifiable_claim when both are given and the promise makes a
 *                         strictly stronger numeric claim (Marketing promise the product can't
 *                         back). [claims-boundary]
 *
 * EMIT (arbitration, fail-closed park) — when it CANNOT confidently judge:
 *   - SYNTHETIC-UNVERIFIED — a claim labelled synthetic:true but with no source: synthetic is
 *                            allowed (labelled), but unverified-synthetic is a judgment call the
 *                            Copy Lead surfaces rather than passing or hard-rejecting. emit().
 *   - PROMISE-UNCHECKABLE  — a market_promise present but NO offer_verifiable_claim to check it
 *                            against: the claims-boundary cannot be evaluated => arbitration, never
 *                            a guessed pass (claims-boundary stays independent, base principle).
 *   owner="copy_lead". artifactPrecedence defaults 50 (the message_brief/spine rank the copy
 *   carries) so the resolver orders the concern in the per-unit bundle.
 *
 * Internal error => exit 2 (fail-closed). Pure core = evaluate(artifact) (no disk), so the
 * bite-test proves each class. Mirrors role-parity-scan.js.
 *
 *   node scripts/checks/chief-coherence-enforcer.js <copy-artifact.json> [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "chief-coherence-enforcer";
const OWNER = "copy_lead";

const READABILITY_MAX = 8; // greased-slide / clarity floor (resonance rubric: readability_grade_max 8)
const BELIEF_MAX = 6; // the <=6 necessary-beliefs rule (chief-coherence)
const BELIEF_FORM = /^I believe that/i;
const REQUIRED_CHIEF_REFS = ["avatar", "offer_brief", "research", "necessary_beliefs"];
// "discover the secret"-class hype phrasing (copy-over-creative: argument, not power-words).
const HYPE_PHRASES = [
  "discover the secret",
  "one weird trick",
  "doctors hate",
  "shocking truth",
  "you won't believe",
  "this simple trick",
];

/** Count ALL-CAPS word runs (>=3 consecutive all-caps words of length >=2). */
function hasAllCapsRun(body) {
  const words = String(body).split(/\s+/);
  let run = 0;
  for (const w of words) {
    const core = w.replace(/[^A-Za-z]/g, "");
    if (core.length >= 2 && core === core.toUpperCase() && /[A-Z]/.test(core)) {
      run++;
      if (run >= 3) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

/** Exclamation density: > 1 per 120 chars of body flags hype. */
function exclamationDensityHigh(body) {
  const s = String(body);
  if (s.length === 0) return false;
  const bangs = (s.match(/!/g) || []).length;
  return bangs > Math.max(1, Math.floor(s.length / 120));
}

/** Extract the first numeric magnitude from a string (for the coarse claims-boundary check). */
function firstNumber(s) {
  const m = String(s).match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/**
 * Pure assertion core.
 * @param {object} a the copy artifact (see header shape)
 * @returns {{ errors: string[], emits: Array<object> }}
 */
function evaluate(a) {
  const errors = [];
  const emits = [];

  if (!a || typeof a !== "object" || Array.isArray(a)) {
    // fail-closed: a non-object input is not a pass.
    errors.push("input is not a copy-artifact object (fail-closed)");
    return { errors, emits };
  }

  const id = a.id || "(no id)";
  const body = typeof a.body === "string" ? a.body : "";

  // NO-CHIEF-REVIEW — the gate that turns chiefing from aspiration into a release gate.
  const cr = a.chief_review;
  if (!cr || cr.reviewed !== true) {
    errors.push(`no-chief-review: copy#${id} has no completed chief_review artifact (chiefing is a release gate, not optional)`);
  } else {
    const refs = Array.isArray(cr.references) ? cr.references : [];
    const missing = REQUIRED_CHIEF_REFS.filter((r) => !refs.includes(r));
    if (missing.length) {
      errors.push(`no-chief-review: copy#${id} chief_review does not reference ${missing.join(" + ")} (must cover avatar + offer_brief + research + necessary_beliefs)`);
    }
  }

  // READABILITY — greased-slide floor.
  if (typeof a.readability_grade === "number" && a.readability_grade > READABILITY_MAX) {
    errors.push(`readability: copy#${id} reads at grade ${a.readability_grade} > ${READABILITY_MAX} (clarity / greased-slide floor)`);
  }

  // BELIEF-COUNT + BELIEF-FORM.
  const beliefs = Array.isArray(a.necessary_beliefs) ? a.necessary_beliefs : [];
  if (beliefs.length > BELIEF_MAX) {
    errors.push(`belief-count: copy#${id} has ${beliefs.length} necessary beliefs > ${BELIEF_MAX} (the <=6 rule)`);
  }
  beliefs.forEach((b, i) => {
    if (!BELIEF_FORM.test(String(b).trim())) {
      errors.push(`belief-form: copy#${id} belief[${i}] "${String(b).slice(0, 48)}" is not in the required 'I believe that…' form`);
    }
  });

  // DECORATIVE-IMAGE — no decorative images (every image earns its place).
  const images = Array.isArray(a.images) ? a.images : [];
  images.forEach((img, i) => {
    if (img && String(img.role).toLowerCase() === "decorative") {
      errors.push(`decorative-image: copy#${id} image[${i}] is decorative (no decorative images — every image installs a belief / removes an objection)`);
    }
  });

  // POWER-WORD — hype standing in for argument.
  if (hasAllCapsRun(body)) {
    errors.push(`power-word: copy#${id} body contains an ALL-CAPS run (>=3 consecutive caps words) — hype over argument (copy-over-creative)`);
  }
  if (exclamationDensityHigh(body)) {
    errors.push(`power-word: copy#${id} body has high exclamation density — hype over argument (copy-over-creative)`);
  }
  const lowerBody = body.toLowerCase();
  for (const phrase of HYPE_PHRASES) {
    if (lowerBody.includes(phrase)) {
      errors.push(`power-word: copy#${id} body contains hype phrasing "${phrase}" (argument, not power-words)`);
    }
  }

  // INVENTED-DATA — a metric/statistic claim with NO source and not labelled synthetic.
  const claims = Array.isArray(a.claims) ? a.claims : [];
  claims.forEach((c, i) => {
    if (!c || typeof c !== "object") return;
    const hasSource = typeof c.source === "string" && c.source.trim() !== "";
    const isMetric = c.metric === true || /\b\d+(\.\d+)?\s?%|\b\d{2,}\b/.test(String(c.text || ""));
    if (isMetric && !hasSource && c.synthetic !== true) {
      errors.push(`invented-data: copy#${id} claim[${i}] "${String(c.text).slice(0, 60)}" is a metric with no source and is not labelled synthetic:true (no-invented-data)`);
    }
    // SYNTHETIC-UNVERIFIED (emit) — labelled synthetic but unsourced: judgment call, not a hard pass.
    if (c.synthetic === true && !hasSource) {
      emits.push({
        reason: "synthetic-unverified",
        decision: `park: copy#${id} claim[${i}] is labelled synthetic but has no source`,
        rationale: `claim "${String(c.text).slice(0, 80)}" is labelled synthetic:true (so not auto-rejected as invented data) but carries no source for the extrapolation; the Copy Lead surfaces unverified-synthetic for arbitration rather than passing or hard-rejecting it`,
        confidence: 0.4,
        precedenceBasis: "no-invented-data: synthetic labelled but unverified",
      });
    }
  });

  // CLAIMS-BOUNDARY — market_promise must not exceed the offer's verifiable claim.
  const promise = a.market_promise;
  const verifiable = a.offer_verifiable_claim;
  if (typeof promise === "string" && promise.trim() !== "") {
    if (typeof verifiable === "string" && verifiable.trim() !== "") {
      const pNum = firstNumber(promise);
      const vNum = firstNumber(verifiable);
      // Coarse, conservative numeric check: a strictly larger promised magnitude than the
      // product can verify is a claims-boundary breach (Marketing promise the product can't back).
      if (pNum !== null && vNum !== null && pNum > vNum) {
        errors.push(`claims-boundary: copy#${id} market_promise (${pNum}) exceeds offer_verifiable_claim (${vNum}) — a promise the product cannot back (claims-boundary)`);
      }
    } else {
      // PROMISE-UNCHECKABLE (emit) — no verifiable claim to check the promise against.
      emits.push({
        reason: "promise-uncheckable",
        decision: `park: copy#${id} market_promise has no offer_verifiable_claim to bound it`,
        rationale: `a market_promise is present ("${promise.slice(0, 80)}") but no offer_verifiable_claim was supplied to evaluate the claims-boundary; the boundary cannot be confirmed so the Copy Lead parks it for arbitration rather than green-lighting an unbounded promise (claims-boundary stays independent)`,
        confidence: 0.4,
        precedenceBasis: "claims-boundary: promise present, product ceiling absent",
      });
    }
  }

  return { errors, emits };
}

function main(argv) {
  const json = argv.includes("--json");
  const file = argv.slice(2).find((x) => !x.startsWith("--"));
  if (!file) {
    process.stderr.write("usage: chief-coherence-enforcer.js <copy-artifact.json> [--json]\n");
    return 2; // fail-closed
  }

  let result, emitted;
  try {
    const { emit } = require(path.join(ROOT, "scripts/arbitration/emit.js"));
    const a = JSON.parse(fs.readFileSync(path.resolve(file), "utf8").replace(/^﻿/, ""));
    result = evaluate(a);
    emitted = [];
    const unit = a && a.id ? a.id : path.basename(file);
    for (const e of result.emits) {
      emitted.push(
        emit({
          unit,
          owner: OWNER,
          decision: e.decision,
          rationale: e.rationale,
          confidence: e.confidence,
          precedenceBasis: e.precedenceBasis,
          // FAIL-CLOSED: omit arbitrationNeeded ⇒ true (β Q2).
          artifactPrecedence: typeof a.precedence === "number" ? a.precedence : 50,
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
        { ok: !rejected && !parked, check: NAME, owner: OWNER, rejected, parked, errors,
          arbitration: emitted.map((r) => ({ id: r.id, unit: r.unit, decision: r.decision })) },
        null, 2,
      ) + "\n",
    );
    return rejected || parked ? 1 : 0;
  }

  if (rejected) {
    process.stderr.write(
      `REJECT [${NAME}] copy failed the editor-in-chief / no-invented-data gate (${errors.length}):\n${errors.map((e) => "  - " + e).join("\n")}\n`,
    );
    return 1;
  }
  if (parked) {
    process.stderr.write(
      `ARBITRATION [${NAME}] copy parked for arbitration (${emits.length}) — NOT done until α/β resolve:\n${emits.map((e) => "  ▸ " + e.decision).join("\n")}\n  (emitted to runtime/arbitration; the resolver gate will block ship-ready)\n`,
    );
    return 1;
  }
  process.stdout.write(`OK   [${NAME}] copy passes chiefing discipline + no-invented-data\n`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, hasAllCapsRun, exclamationDensityHigh, NAME, OWNER };
