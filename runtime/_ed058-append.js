// one-shot: append ED-058 — model-chain intentionality has no enforcer
const fs = require("fs");
const p = ".claude/project/memory/enforcement-debt.jsonl";
const entry = {
  id: "ED-058",
  ts: "2026-06-16T22:30:00.000Z",
  policy:
    "The role-registry (.claude/agents/_org/role-registry.json) model/effort chain must be INTENTIONAL and match operator policy 2026-06-16: Claude Opus 4.8 at MAX effort only at the top (alpha), no `fable` anywhere, every role carries a model+effort scaled appropriately to its job. A drifted/unintentional model or effort, or a retired model id sneaking in, must be self-detecting.",
  source: "operator directive 2026-06-16 (use Opus 4.8 max not fable; align downstream) + memory feedback_model_opus48max_not_fable",
  missing_enforcer: "scan-or-models-check",
  candidate_enforcers: [
    "extend scripts/models/check.js (or a new scan:model-chain wired into /scan:full) to assert: alpha = claude-opus-4-8 / effort max; NO role references `fable`/`claude-fable-5`; every role has both `model` and `effort`; effort does not INCREASE going down the tier ladder (face > director > lead > worker sanity)",
    "a release/scan gate that fails when a role's model is not in the live catalog (catalog-completeness — folds into the deferred model-router refresh's catalog enforcer)",
  ],
  severity: "medium",
  status: "open",
  note: "The next-session E-DISPATCH-SHAPE chain-alignment work (operator: walk the chain, tune each agent's intelligence/effort) MUST ship this enforcer per the named-enforcer rule. Until then the Opus-4.8-max-top / no-fable / intentional-chain policy is prose-only. Current state 2026-06-16: registry already has opus-4.8 top + alpha=max + no fable wired (only an unrelated PAYMENTS_GUIDE template mentions fable) — so the policy holds today but is unenforced against future drift.",
};
const existing = fs.readFileSync(p, "utf8");
if (existing.includes('"ED-058"')) { console.log("ED-058 already present — no-op"); }
else { fs.appendFileSync(p, JSON.stringify(entry) + "\n"); console.log("ED-058 appended;", fs.readFileSync(p, "utf8").trim().split("\n").length, "entries"); }
