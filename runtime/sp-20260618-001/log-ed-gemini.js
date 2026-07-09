#!/usr/bin/env node
"use strict";
// One-shot: append the gemini-tier provider-readiness ED to enforcement-debt.jsonl.
// Standalone script (hook permits these; direct node -e fs-write is blocked).
const fs = require("fs");
const path = require("path");
const p = path.resolve(__dirname, "..", "..", ".claude/project/memory/enforcement-debt.jsonl");

// Determine the next ED-NNN id from the existing log.
let next = 60;
try {
  const lines = fs.readFileSync(p, "utf8").trim().split("\n");
  const ids = lines
    .map((l) => {
      try {
        return JSON.parse(l).id;
      } catch {
        return null;
      }
    })
    .filter((id) => /^ED-\d+$/.test(id || ""))
    .map((id) => parseInt(id.slice(3), 10));
  if (ids.length) next = Math.max(...ids) + 1;
} catch {
  /* fresh log */
}
const id = "ED-" + String(next).padStart(3, "0");

const rec = {
  id,
  ts: new Date().toISOString(),
  policy:
    "The gemini CLI (gemini-3.1-pro-preview) is the security-reviewer's PRIMARY pass and the default cross-provider reviewer, but its auth tier is no longer eligible (IneligibleTierError: 'no longer supported for Gemini Code Assist for individuals; migrate to the Antigravity suite'). A dispatch to gemini fails at spawn with NO pre-flight signal — the failure only surfaces mid-gauntlet as ok:false/output:'', and is only NOT a silent gauntlet hole because the operator/conductor recognizes it as a provider condition and fails over to the GPT 2nd pass. Nothing structurally pre-detects 'gemini is tier-dead' before a sprint's gauntlet depends on it.",
  source: "SP-20260618-001 templates-migration gauntlet (security-reviewer primary pass) 2026-06-18",
  missing_enforcer: "provider-readiness-preflight (gemini/Antigravity tier eligibility)",
  candidate_enforcers: [
    "scripts/models:check (or test-dispatch-config) probes each configured provider's auth tier and exits non-zero / warns loudly when a provider used by a binding gauntlet lane is ineligible — so a dead provider is caught at /scan time, not mid-gauntlet",
    "the security-reviewer dispatch auto-fails-over gemini->GPT-2nd-pass when the primary returns a tier/eligibility error (codify the sanctioned failover so it is not a per-run human recognition), recording the degraded 3-provider->GPT+Claude lane visibly",
    "migrate gemini auth to the Antigravity/agy suite (operator action) so the primary pass is restored",
  ],
  severity: "medium",
  status: "open",
  note: "Did NOT block SP-20260618-001: the GPT 2nd-pass failover is sanctioned and binding (security review degraded 3-provider -> GPT+Claude, still a real binding pass). Operator surfaced the gemini->Antigravity auth as a provider-readiness gap. Companion to the dispatch-reliability reap modes in runtime/sp-20260618-001/REAP-FIX-NOTE.md (clamp / silent-bg-drop / outer-timeout-ceiling).",
};

fs.appendFileSync(p, JSON.stringify(rec) + "\n");
console.log("appended", id, "to enforcement-debt.jsonl");
