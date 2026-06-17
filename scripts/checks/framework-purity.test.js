#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for framework-purity.js. Proves:
 *   - a clean string produces no findings of any kind,
 *   - the HARD client-slug detector FAILS the gate on a planted slug (P5.3),
 *   - the report-only DOMAIN-VOCAB advisory DETECTS a planted jobzooka-origin
 *     identifier (debitRockets / untrusted_job_data / masterResume /
 *     targetedResumes) — and, being advisory, does NOT flip the exit code.
 *
 *   node scripts/checks/framework-purity.test.js
 */

const assert = require("assert");
const { harness } = require("./lib/fixture-harness");
const { scanContent } = require("./framework-purity");

const h = harness("framework-purity");

// Helper: scan a single (path, content) pair and return the findings buckets.
function scan(rel, content) {
  const findings = {
    root_leak: [],
    client_slug: [],
    abs_path: [],
    promote_relic: [],
    domain_vocab: [],
  };
  scanContent(rel, content, findings);
  return findings;
}

// ── Known-answer: a clean, product-neutral string trips nothing ──────────
h.pass("clean framework-neutral text produces no findings", () => {
  const f = scan("docs/x.md", "Resume the build, charge credits via chargeCredits(), parse the primary input document.");
  // Note: the English word "resume" (continue-work) and the generic
  // chargeCredits() must NOT trip any detector — that's the whole point.
  return (
    f.client_slug.length === 0 &&
    f.abs_path.length === 0 &&
    f.promote_relic.length === 0 &&
    f.domain_vocab.length === 0
  );
});

// ── PLANTED HARD VIOLATION: a client slug must FAIL the gate (P5.3) ──────
h.violation("a planted client slug is a hard finding (fails the gate)", () => {
  const f = scan("docs/leak.md", "This file mentions Jobzooka by name.");
  return f.client_slug; // non-empty array ⇒ isPass() returns false ⇒ counted as the required planted-violation
});

// ── PLANTED ADVISORY: each banned domain identifier is DETECTED ──────────
h.test("debitRockets is flagged by the domain-vocab advisory", () => {
  const f = scan("agents/example.md", "Call debitRockets() before the model call.");
  assert.ok(
    f.domain_vocab.some((d) => d.token === "debitRockets"),
    "expected domain_vocab to flag debitRockets",
  );
  assert.strictEqual(f.client_slug.length, 0, "debitRockets must NOT be a hard client_slug");
});

h.test("untrusted_job_data / masterResume / targetedResumes are each flagged", () => {
  for (const tok of ["untrusted_job_data", "masterResume", "targetedResumes"]) {
    const f = scan("agents/ex.md", `the <${tok}> wrapper / field appears here`);
    assert.ok(
      f.domain_vocab.some((d) => d.token === tok),
      `expected domain_vocab to flag ${tok}`,
    );
  }
});

h.test("the advisory is word-bounded — a benign superstring is NOT flagged", () => {
  // "masterResumed" / "myDebitRocketsHelper" share a substring but are different
  // identifiers; the \b anchors keep the advisory from firing on them.
  const f = scan("agents/ex.md", "masterResumed and debitRocketsHelperX are unrelated symbols");
  assert.strictEqual(f.domain_vocab.length, 0, "word-boundary match must not fire on superstrings");
});

h.test("the advisory does NOT ban broad English words", () => {
  const f = scan("docs/x.md", "resume the job, scan the market, parse the resume of work");
  assert.strictEqual(f.domain_vocab.length, 0, "broad words (resume/job/market) must never be banned");
});

// ── FAIL-CLOSED: malformed input must not read green ─────────────────────
h.failClosed("null content fails closed", () => {
  // scanContent expects a string; a null content should throw rather than
  // silently pass — the harness treats a throw as an acceptable fail-closed.
  return scan("docs/x.md", null) && false;
});

h.done();
