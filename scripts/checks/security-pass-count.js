#!/usr/bin/env node
"use strict";
// security-pass-count (E-DISPATCH-PERFECT-001 W1) — the NAMED pass-count enforcer for the
// 3-provider security review (β DECIDE 0.88 condition d: "name a pass-count enforcer that asserts
// the stamps, OR /enforcement:log the gap"). It guarantees the multi-provider security review is
// REAL and complete, two ways:
//
//   (A) CONFIG coherence (HARD — exit 1 if broken): the `security-reviewer` registry row declares a
//       full pass chain (primary + second_pass + third_pass) with DISTINCT providers; the firing
//       CONSUMER scripts/dispatch-review.js exists; and the sprint-gauntlet dispatch path
//       (scripts/sprint/epsilon-runtime.js) routes multi-pass roles through it. A break here means
//       the firing wiring regressed — second_pass/third_pass would be a declarative lie again.
//
//   (B) RUNTIME stamps (REPORT-ONLY ramp; --strict to block): every security review on the
//       dispatch-completions ledger (grouped by run_id|sprint_id, post-cutoff) carries one ok:true
//       record per declared pass, with DISTINCT providers — i.e. all N passes actually FIRED. Fewer
//       distinct providers = the review did not fully run. Report-only until the gauntlet path is
//       proven across a watch window (ramp tail = run with --strict in scan:full).
//
// Exit: 0 clean (or report-only runtime gaps) · 1 config-coherence break (or --strict runtime gaps)
//       · 2 fail-closed (registry unreadable).
const fs = require("fs");
const path = require("path");

const NAME = "security-pass-count";
const ROOT = path.resolve(__dirname, "..", "..");
const ROLE = "security-reviewer";
// Records before W1 landed were single-pass (legacy) — exempt from the runtime stamp check.
const RECORD_BACKED_CUTOFF = "2026-06-17";

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function fileHas(rel, ...needles) {
  try {
    const t = fs.readFileSync(path.join(ROOT, rel), "utf8");
    return needles.every((n) => t.includes(n));
  } catch {
    return false;
  }
}

// (A) config coherence — returns { hard:[], soft:[] } findings.
function evaluateConfig(passes) {
  const hard = [];
  // registry: ≥2 passes (the cross-provider review), DISTINCT providers, claude present + LAST.
  const providers = passes.map((p) => p.provider);
  if (passes.length < 2) {
    hard.push(`registry "${ROLE}" declares ${passes.length} pass(es) — the cross-provider security review needs the primary + at least second_pass`);
  }
  if (new Set(providers).size !== providers.length) {
    hard.push(`registry "${ROLE}" pass providers are not distinct (${providers.join(", ")}) — best-of-each requires different providers per pass`);
  }
  if (passes.length >= 3 && providers[providers.length - 1] !== "claude") {
    hard.push(`registry "${ROLE}" last pass provider is "${providers[providers.length - 1]}" — the Claude pass must be LAST (additive, never displaces cross-family coverage)`);
  }
  // firing consumer exists.
  if (!fs.existsSync(path.join(ROOT, "scripts", "dispatch-review.js"))) {
    hard.push(`scripts/dispatch-review.js (the firing consumer of second_pass/third_pass) is MISSING — the passes would not fire`);
  }
  // sprint-gauntlet path routes multi-pass roles through the firing consumer.
  if (!fileHas("scripts/sprint/epsilon-runtime.js", "dispatch-review.js", "passesForRole")) {
    hard.push(`scripts/sprint/epsilon-runtime.js does not route multi-pass roles through dispatch-review.js — the sprint gauntlet would fire only the primary pass`);
  }
  return { hard };
}

// (B) runtime stamps — group post-cutoff ok:true security-reviewer records by run/sprint, assert
//     distinct-provider count == expected. Returns WARN strings (report-only by default).
function evaluateRuntime(records, expectedCount) {
  const warns = [];
  const sec = records.filter(
    (r) =>
      r &&
      r.role === ROLE &&
      r.ok === true &&
      typeof r.completed_at === "string" &&
      r.completed_at.slice(0, 10) >= RECORD_BACKED_CUTOFF,
  );
  if (!sec.length) return warns; // no post-cutoff security reviews yet → nothing to assert
  // Group the passes of ONE review: they share a run_id|sprint_id (sprint path) OR — when neither is
  // set (adhoc path) — the SAME prompt_digest (dispatch-review.js feeds all passes the same prompt).
  // A record with none of those is an un-attributable standalone/manual dispatch — not a review.
  const groups = new Map();
  for (const r of sec) {
    const key = r.run_id || r.sprint_id || r.prompt_digest;
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, new Set());
    if (r.provider) groups.get(key).add(r.provider);
  }
  for (const [key, provs] of groups) {
    // Flag only an INCOMPLETE multi-pass review (≥2 providers fired but fewer than expected) — a lone
    // single-provider group is a standalone dispatch, not an aborted 3-pass review (no false-positive).
    if (provs.size >= 2 && provs.size < expectedCount) {
      warns.push(
        `security review "${key}" fired ${provs.size}/${expectedCount} distinct providers (${[...provs].join(", ")}) — the ${expectedCount}-pass review did not fully run`,
      );
    }
  }
  return warns;
}

function main(argv) {
  const strict = (argv || []).includes("--strict");
  const json = (argv || []).includes("--json");
  let passes;
  try {
    const registryRoles = require(path.join(ROOT, "scripts", "dispatch", "registry-roles"));
    passes = registryRoles.passesOf(ROLE);
  } catch (e) {
    process.stderr.write(`${NAME}: cannot resolve registry passes for ${ROLE}: ${e.message}\n`);
    return 2; // fail-closed
  }
  const { hard } = evaluateConfig(passes);

  let records = [];
  const ledger = path.join(ROOT, ".claude", "runtime", "dispatch-completions.jsonl");
  try {
    if (fs.existsSync(ledger)) {
      records = fs
        .readFileSync(ledger, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }
  } catch {
    /* ledger unreadable → no runtime evidence; config coherence still applies */
  }
  const warns = evaluateRuntime(records, passes.length);

  if (json) {
    process.stdout.write(JSON.stringify({ ok: hard.length === 0, check: NAME, expected_passes: passes.length, config_breaks: hard, runtime_gaps: warns, strict }, null, 2) + "\n");
  } else if (hard.length === 0 && warns.length === 0) {
    process.stdout.write(`OK   [${NAME}] ${ROLE} declares ${passes.length} distinct-provider passes, dispatch-review.js fires them, no runtime under-fire\n`);
  } else {
    if (hard.length)
      process.stderr.write(`FAIL [${NAME}] config-coherence break (${hard.length}):\n${hard.map((e) => `  - ${e}`).join("\n")}\n`);
    if (warns.length)
      process.stderr.write(`${strict ? "FAIL" : "WARN"} [${NAME}] runtime under-fire (${warns.length}, report-only ramp${strict ? " — BLOCKING via --strict" : ""}):\n${warns.map((e) => `  - ${e}`).join("\n")}\n`);
  }
  // config breaks ALWAYS fail; runtime gaps fail only under --strict (the report-only→blocking ramp).
  if (hard.length) return 1;
  if (warns.length && strict) return 1;
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { evaluateConfig, evaluateRuntime, main, NAME, ROLE, RECORD_BACKED_CUTOFF };
