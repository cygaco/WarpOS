#!/usr/bin/env node
"use strict";

/**
 * Bite-test for chief-coherence-enforcer.js — proves evaluate() REJECTS each
 * chiefing / no-invented-data class AND emits arbitration on the uncertain paths
 * (an enforcer with no negative test is a false-green waiting to happen).
 *
 *   node scripts/checks/chief-coherence-enforcer.test.js
 */

const assert = require("assert");
const { evaluate, hasAllCapsRun, exclamationDensityHigh } = require("./chief-coherence-enforcer");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// A fully conformant copy artifact (positive baseline).
function clean() {
  return {
    type: "advertorial",
    id: "ad-1",
    body: "Most teams lose hours to flaky test runs. Our runner isolates each worktree so reruns stay clean. See the benchmark below.",
    readability_grade: 6,
    necessary_beliefs: [
      "I believe that flaky tests cost me real time",
      "I believe that isolation fixes the root cause",
    ],
    images: [{ role: "proof" }],
    claims: [{ text: "cut rerun time 40%", source: "internal-benchmark-2026.md", metric: true, synthetic: false }],
    market_promise: "save up to 40% of rerun time",
    offer_verifiable_claim: "measured 40% reduction in CI rerun time",
    chief_review: { reviewed: true, references: ["avatar", "offer_brief", "research", "necessary_beliefs"] },
  };
}
const clone = (o) => JSON.parse(JSON.stringify(o));
const hasReason = (emits, r) => emits.some((e) => e.reason === r);

// 0. POSITIVE — conformant copy ⇒ no errors, no emits.
test("conformant copy → 0 errors, 0 emits", () => {
  const { errors, emits } = evaluate(clean());
  assert.deepStrictEqual(errors, [], `expected clean, got: ${errors.join("; ")}`);
  assert.strictEqual(emits.length, 0, `expected no emits, got: ${emits.map((e) => e.reason).join(",")}`);
});

// 1. BITE — no chief_review artifact.
test("missing chief_review → rejected (no-chief-review)", () => {
  const a = clean(); delete a.chief_review;
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /no-chief-review:.*no completed chief_review/.test(e)), errors.join("; "));
});

// 1b. BITE — chief_review present but missing a required reference.
test("chief_review missing a required reference → rejected", () => {
  const a = clean(); a.chief_review.references = ["avatar", "offer_brief"]; // drops research + necessary_beliefs
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /chief_review does not reference research \+ necessary_beliefs/.test(e)), errors.join("; "));
});

// 2. BITE — readability grade over the floor.
test("readability_grade > 8 → rejected", () => {
  const a = clean(); a.readability_grade = 12;
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /readability:.*grade 12 > 8/.test(e)), errors.join("; "));
});

// 3. BITE — too many beliefs.
test("> 6 necessary beliefs → rejected (belief-count)", () => {
  const a = clean();
  a.necessary_beliefs = Array.from({ length: 7 }, (_, i) => `I believe that point ${i}`);
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /belief-count:.*7 necessary beliefs > 6/.test(e)), errors.join("; "));
});

// 3b. BITE — a belief not in the required form.
test("belief not in 'I believe that…' form → rejected (belief-form)", () => {
  const a = clean(); a.necessary_beliefs = ["Flaky tests are bad"];
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /belief-form:.*not in the required/.test(e)), errors.join("; "));
});

// 4. BITE — a decorative image.
test("decorative image → rejected", () => {
  const a = clean(); a.images = [{ role: "decorative" }];
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /decorative-image:/.test(e)), errors.join("; "));
});

// 5. BITE — power-word stuffing (ALL-CAPS run).
test("ALL-CAPS run in body → rejected (power-word)", () => {
  const a = clean(); a.body = "THIS CHANGES EVERYTHING for your team, guaranteed.";
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /power-word:.*ALL-CAPS run/.test(e)), errors.join("; "));
});

// 5b. BITE — hype phrasing.
test("hype phrasing in body → rejected (power-word)", () => {
  const a = clean(); a.body = "We will discover the secret to clean test runs together.";
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /hype phrasing "discover the secret"/.test(e)), errors.join("; "));
});

// 6. BITE — invented data: a metric claim with no source, not labelled synthetic.
test("unsourced metric claim not labelled synthetic → rejected (invented-data)", () => {
  const a = clean();
  a.claims = [{ text: "trusted by 12000 teams", source: null, metric: true, synthetic: false }];
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /invented-data:.*metric with no source/.test(e)), errors.join("; "));
});

// 7. BITE — claims-boundary: market_promise exceeds the verifiable claim.
test("market_promise magnitude exceeds offer_verifiable_claim → rejected (claims-boundary)", () => {
  const a = clean();
  a.market_promise = "save up to 90% of rerun time";
  a.offer_verifiable_claim = "measured 40% reduction in CI rerun time";
  const { errors } = evaluate(a);
  assert.ok(errors.some((e) => /claims-boundary:.*exceeds offer_verifiable_claim/.test(e)), errors.join("; "));
});

// 8. EMIT — synthetic but unsourced ⇒ arbitration (not a hard reject, not a pass).
test("synthetic claim with no source → emits arbitration (synthetic-unverified)", () => {
  const a = clean();
  a.claims = [{ text: "approx 30% of teams report this", source: null, metric: true, synthetic: true }];
  const { errors, emits } = evaluate(a);
  assert.ok(!errors.some((e) => /invented-data/.test(e)), "labelled synthetic is NOT invented-data");
  assert.ok(hasReason(emits, "synthetic-unverified"), `expected synthetic-unverified emit, got: ${emits.map((e) => e.reason).join(",")}`);
  assert.ok(emits.find((e) => e.reason === "synthetic-unverified").confidence < 0.5, "fail-closed park");
});

// 9. EMIT — promise present but no verifiable claim to check it against ⇒ arbitration.
test("market_promise with no offer_verifiable_claim → emits arbitration (promise-uncheckable)", () => {
  const a = clean();
  a.market_promise = "the fastest runner on the market";
  delete a.offer_verifiable_claim;
  const { errors, emits } = evaluate(a);
  assert.ok(!errors.some((e) => /claims-boundary/.test(e)), "cannot hard-reject without a ceiling");
  assert.ok(hasReason(emits, "promise-uncheckable"), `expected promise-uncheckable emit, got: ${emits.map((e) => e.reason).join(",")}`);
});

// fail-closed — a non-object input is rejected, not passed.
test("non-object input → rejected (fail-closed)", () => {
  const { errors } = evaluate("not an object");
  assert.ok(errors.some((e) => /not a copy-artifact object/.test(e)), errors.join("; "));
});

// sanity — the text heuristics behave.
test("hasAllCapsRun / exclamationDensityHigh sanity", () => {
  assert.strictEqual(hasAllCapsRun("BUY NOW TODAY"), true);
  assert.strictEqual(hasAllCapsRun("Buy now today"), false);
  assert.strictEqual(exclamationDensityHigh("!!!!!"), true);
  assert.strictEqual(exclamationDensityHigh("A calm, single sentence."), false);
});

if (failures.length) {
  process.stderr.write(`chief-coherence-enforcer bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`chief-coherence-enforcer bite-test: ${passed}/${passed} passed (positive + 10 reject classes + 2 arbitration emits + fail-closed + sanity)\n`);
process.exit(0);
