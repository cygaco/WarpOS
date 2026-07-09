You are a security reviewer. Review a DISPATCH SELF-MODIFICATION + a new dispatch enforcer for security defects. This is the sprint dispatch-hierarchy keystone — a flaw here affects WHO may spawn agents and whether a security-critical invariant can be widened. Render a BINDING verdict: PASS or FAIL.

CONTEXT (ADR-0014, E-DISPATCH-PERFECT-001 W5): the change RETIRES the "ED-041 α-only" doctrine. Previously `mode_profiles.sprint.alpha_only_shapes = ["in-process-agent"]` recorded that only the TOP-LEVEL orchestrator (α) could spawn the in-process roster via the Agent tool. The change empties it to `[]` — the ε conductor (top-level OR a teammate-spawned ε) may now summon the in-process roster directly, each spawn supplying a scopeContract. Rationale: ED-041 ("Agent unavailable inside subagents") was a per-spec misstatement — a Claude subagent has the Agent tool iff its spec lists it, and ε's does (verified 3 probes + a live teammate-ε this session).

THE LOAD-BEARING SECURITY INVARIANT that must NOT be weakened (from the contract's own _doc): "a mode profile can ONLY REMOVE a shape, NEVER ADD one the class/role does not already allow. Every shape a profile lists for a class/role MUST be a SUBSET of that class/role's own allowed_shapes." Emptying alpha_only_shapes is a SEPARATE annotation (it records WHO may use a shape, not WHICH shapes a class has) — VERIFY it does not interact with or weaken the subset-ceiling invariant.

EVALUATE the dispatch-contract.js + .json change (keystone.diff):
- Does emptying alpha_only_shapes WIDEN any role's dispatch capability beyond its class ceiling? (It should not — it's a who-annotation, not a what-narrowing. Confirm the validator still rejects a profile that widens past the class ceiling — that test must still hold.)
- Does the dispatch-contract.js comment change KEEP the validation logic intact (the array-of-known-shapes check)? Is an EMPTY array still validated correctly (not a silently-ignored or crash case)?
- Could a teammate-ε now spawn something it should NOT (a build-chain role in-process, a cross-provider reviewer in-process — both kill provider diversity / context)? The contract should STILL reject those (they're class-derivation rejections, independent of the α-only annotation).

THE NEW ENFORCER (consult-roster-no-dispatch.js — the no-deep-cascade guarantee). Its job: a roster role summoned at a CONSULT hook-point (sprint step plan/design) must NOT carry Bash/Agent (so it cannot dispatch the build chain / cascade — "spawn-hand stays with the conductor; ε is the sole builder-dispatcher"). It reads each consult role's REAL spec frontmatter tools (rename-proof) joined with the hook-points. EVALUATE:
- Is the no-cascade guarantee SOUND? Can a summoned roster consult still dispatch the build chain despite this check? (Note the documented quality-lead exemption — it's a dual-role pod-coordinator summoned at design BUT carrying [Bash,Agent] for its gauntlet fan-out; the check REPORTS it, logs ED-065. Is trusting quality-lead's design-consult read-only-ness via scopeContract acceptable, or a real hole?)
- Does the enforcer FAIL-CLOSED on its own error (exit 2, not green)? Does it FIRE on a real violation (a consult role gaining Bash/Agent) — not just exist?
- Any way the frontmatter read or the hook-point join is spoofable / desyncs?

Output VERDICT: PASS or VERDICT: FAIL, then findings tagged [CRITICAL]/[HIGH]/[MEDIUM]/[LOW] with the specific line/mechanism + fix. PASS only if the security invariant is intact AND the no-cascade guarantee has no CRITICAL/HIGH hole.

=== DIFF: keystone (dispatch-contract.json + .js + epsilon.md + CODEX.md) vs main ===
diff --git a/.claude/agents/_org/dispatch-contract.json b/.claude/agents/_org/dispatch-contract.json
index 1b9d345f..7a8ce36c 100644
--- a/.claude/agents/_org/dispatch-contract.json
+++ b/.claude/agents/_org/dispatch-contract.json
@@ -193,7 +193,7 @@
 
   "role_overrides": {
     "_doc": "Per-role exceptions merged LAST (defaults <- class <- override). Empty by design — exceptions are a smell; prefer fixing the class derivation. Documented carve-outs only.",
-    "epsilon": { "allowed_shapes": ["inline"], "_note": "ε is the sprint conductor: runs inline as the session; its own shape is inline. The in-process roster (`in-process-agent`: managers/leads/design-quality/visual-review) is spawned via the harness Agent tool BY THE TOP-LEVEL ORCHESTRATOR (α) — a teammate-spawned ε CANNOT call the Agent tool (Agent unavailable inside subagents, ED-041). A teammate-ε dispatches the CLI-routable roster only (subprocess-claude builders via dispatch-claude.js, subprocess-cross-provider reviewers via dispatch-agent.js) + drives the ε runtime." }
+    "epsilon": { "allowed_shapes": ["inline"], "_note": "ε is the sprint conductor: runs inline as the session; its own shape is inline. The in-process roster (`in-process-agent`: managers/leads/design-quality/visual-review) is summonable directly by the ε CONDUCTOR in ANY spawn context — top-level (α wearing the ε face) OR a teammate-spawned ε — via the harness Agent tool, each spawn supplying a `scopeContract` (the scope-contract-guard is the real gate). ED-041 ('Agent unavailable inside subagents') is RETIRED as a per-spec misstatement: a Claude subagent HAS the Agent tool iff its spec lists it, and ε's does (ADR-0014; re-verified 2026-06-18 + live-confirmed by the E-TEAMS-MIGRATION-001 teammate-ε). The spawn-hand stays with the conductor — a summoned roster member must NOT dispatch the build chain or cascade further (dispatch-route-guard no-deep-cascade check). A node SCRIPT still cannot call Agent (the ε runtime returns `requires-orchestrator` to hand that spawn to the ε-agent); ε also drives the CLI-routable roster (subprocess-claude builders via dispatch-claude.js, subprocess-cross-provider reviewers via dispatch-agent.js)." }
   },
 
   "mode_profiles": {
@@ -215,8 +215,8 @@
         "claude_pinned_reviewer": ["in-process-agent"],
         "manager": ["in-process-agent"]
       },
-      "alpha_only_shapes": ["in-process-agent"],
-      "_alpha_only_note": "ED-041: in sprint mode the `in-process-agent` shape (managers/leads/design-quality/visual-review) is α-ONLY — only the TOP-LEVEL orchestrator (α, wearing the ε conductor face) can spawn it via the harness Agent tool. A teammate-spawned ε CANNOT call the Agent tool ('Agent is not available inside subagents'), so a teammate-ε dispatches ONLY the CLI-routable roster: subprocess-claude builders (dispatch-claude.js) + subprocess-cross-provider reviewers (dispatch-agent.js). This annotation does NOT narrow class_shapes; it records WHO may use the listed shape."
+      "alpha_only_shapes": [],
+      "_alpha_only_note": "ADR-0014: NO shape is α-only. The `in-process-agent` shape (managers/leads/design-quality/visual-review) is summonable by the ε CONDUCTOR in ANY spawn context — top-level (α wearing the ε face) OR a teammate-spawned ε — via the harness Agent tool, each spawn supplying a `scopeContract`. The prior α-only overlay (added in 975ed5c) encoded ED-041 as a doctrine; ED-041 is RETIRED as a per-spec misstatement (a Claude subagent has the Agent tool iff its spec lists it; ε's does — re-verified 2026-06-18 + live-confirmed by the E-TEAMS-MIGRATION-001 teammate-ε). The array is kept (empty) rather than removed so a reversal is a one-line re-add (ADR-0014 reversal plan). The real gate on a roster spawn is the scope-contract-guard (scopeContract required, fail-closed); the spawn-hand stays with the conductor — a summoned roster consult MUST NOT dispatch the build chain or cascade (the dispatch-route-guard no-deep-cascade check; ε remains the sole builder-dispatcher). CARVE-OUT: a non-Claude orchestrator (Codex) has NO harness Agent tool at all — not because of ED-041, but because it is not a Claude-harness agent — so it uses CLI routes only. This annotation does NOT narrow class_shapes."
     },
     "oneshot": {
       "_doc": "δ standalone skeleton build. Build-chain via subprocess-claude (isolated worktree); no cross-provider reviewers required for a skeleton run.",
diff --git a/.claude/agents/president/epsilon.md b/.claude/agents/president/epsilon.md
index ee8a94b2..03baf54a 100644
--- a/.claude/agents/president/epsilon.md
+++ b/.claude/agents/president/epsilon.md
@@ -128,28 +128,37 @@ Checkpoints give resume. The heartbeat answers liveness. Together they make ε s
 
 ## Dispatch Method
 
-### Conduct routes by spawn context (ED-041)
+### Conduct routes by spawn context (ADR-0014 — ED-041 retired)
 
-ε operates in two contexts — the conduct route is determined by which one is active:
+ε operates in two contexts. The in-process roster is available in **both** — ED-041 ("Agent is not
+available inside subagents") was a **per-spec misstatement**: a Claude subagent has the Agent tool
+**iff its spec lists it**, and ε's does (ADR-0014). So a teammate-spawned ε CAN call the Agent tool
+and summon the roster — the conduct route differs only in subprocess-vs-mixed, not in roster access:
 
 | Context | Spawned via | Agent tool? | Sanctioned routes |
 |---|---|---|---|
 | **Top-level session** | α wearing the ε face | YES | Subprocess wrappers (below) + in-process roster via Agent tool |
-| **Teammate** | `Agent(subagent_type:"epsilon")` into a team | NO — *"Agent is not available inside subagents"* | Subprocess-only: `dispatch-claude.js` (build-chain) · `dispatch-agent.js` (cross-provider) · `claude -p --agent` (non-build Claude roles) |
+| **Teammate** | `Agent(subagent_type:"epsilon")` into a team | **YES** — ε's spec lists `Agent` | Subprocess wrappers (`dispatch-claude.js` / `dispatch-agent.js` / `claude -p --agent`) **+ in-process roster via Agent tool** (supply a `scopeContract`) |
 
-The `in-process-agent` shape (managers/leads/design-quality/visual-review) is **α-only**. A
-teammate-ε that receives `spawned:false, reason:requires-orchestrator` entries from the runtime
-CANNOT dispatch them — report to the team lead so α can dispatch via the Agent tool.
-Operator-ratified 2026-06-09.
+The `in-process-agent` shape (managers/leads/design-quality/visual-review) is **NOT α-only** (ADR-0014
+emptied `mode_profiles.sprint.alpha_only_shapes`). The ε conductor summons it directly **in either
+context**, each spawn supplying a `scopeContract` (the `scope-contract-guard` is the real gate,
+fail-closed without one). The **spawn-hand stays with the conductor**: a summoned roster member must
+NOT dispatch the build chain or cascade further (the `dispatch-route-guard` no-deep-cascade check; ε
+remains the sole builder-dispatcher). A node SCRIPT still cannot call Agent — the ε runtime returns
+`spawned:false, reason:requires-orchestrator`, which is the hand-off to **the ε-agent** (you), not to
+α. (ADR-0014, operator-authorized 2026-06-19; supersedes the 2026-06-09 α-only ratification.)
 
 ### STARTUP ROUTE SELF-CHECK
 
-At spawn, ε MUST determine its context and include it in the `SendMessage(to:"team-lead")`
-readiness report:
-- Agent tool available → `"TOP-LEVEL context: in-process roster available."`
-- Agent tool unavailable → `"TEAMMATE context: subprocess-only routes active; in-process roster deferred to α."`
+At spawn, ε MUST verify the Agent tool is actually callable and report context in the
+`SendMessage(to:"team-lead")` readiness report — self-healing if a future harness/spec change ever
+removes it:
+- Agent tool available (the expected state, top-level OR teammate) → `"<TOP-LEVEL|TEAMMATE> context: in-process roster available (Agent tool present)."`
+- Agent tool genuinely unavailable (unexpected — a spec/harness regression) → `"<context>: Agent tool ABSENT — subprocess-only routes active; in-process roster deferred to α. FLAG: ε spec may have lost the Agent tool (ADR-0014 self-check)."`
 
-This makes the doc's promise verifiable at spawn, not assumed.
+This makes the doc's promise verifiable at spawn, not assumed — and surfaces a regression loudly
+rather than silently falling back.
 
 ### TEAMMATE STALL RULES (WG-6)
 
@@ -165,13 +174,13 @@ Observed as a 25-minute stall ×3 (WG-6). Enforcer: `scripts/checks/epsilon-live
 
 ---
 
-**When ε is the top-level session face**, follow the canonical dispatch pattern inherited from γ/δ verbatim — the machinery is shared, not forked:
+**As the conductor (top-level OR teammate — ADR-0014)**, follow the canonical dispatch pattern inherited from γ/δ verbatim — the machinery is shared, not forked. The in-process roster route below is available in **both** contexts (ε's spec lists the Agent tool):
 
 - Build-chain roles (builders, fixers): `node scripts/dispatch-claude.js <role> <prompt-file> --model sonnet -w` — the reap-guard wrapper is MANDATORY. Never raw `claude -p --agent` for build-chain.
 - Cross-provider (reviewers, security): `node scripts/dispatch-agent.js <role> <prompt-file>` with inline pre-fetch of all files the agent's prompt references (codex/gemini CLIs pipe stdin; they cannot follow relative file paths).
 - Visual judgment roles (design-quality, visual-review): Agent tool dispatch (multimodal; Claude-pinned; exempt from canonical-Bash rule).
 - Non-build Claude roles (test-runner): raw `claude -p --agent <role> < "$PROMPT_FILE"` is allowed.
-- **In-process roster (managers/leads/directors `claude-agent`; `design-quality`/`visual-review` `agent-tool`):** the node runtime CANNOT spawn these — it returns `requires-orchestrator`. YOU dispatch each via `Agent(subagent_type:<role>)`, capture the returned envelope to a file, then write the completion record: `node scripts/sprint/epsilon-runtime.js record-inprocess --sprint <id> --role <role> --step <step> --evidence <file> [--elapsed-ms <n>]`. The record's `ok` is DERIVED FROM the real Agent-return bytes (0-byte → `ok:false`; no evidence file → REFUSED) — the SAME `ok:true` liveness `gauntlet-verify` reads, so an in-process reviewer lane is gated exactly like a CLI lane. **NEVER write the record without the Agent's real return** — there is no `ok:true` without a real spawn behind it (the operator-caught fake-green; ADR-0009 Increment B).
+- **In-process roster (managers/leads/directors `claude-agent`; `design-quality`/`visual-review` `agent-tool`):** the node runtime CANNOT spawn these — it returns `requires-orchestrator` (a node SCRIPT can't call Agent). YOU (the ε-agent, top-level OR teammate — ADR-0014) dispatch each via `Agent(subagent_type:<role>, …)` **supplying a `scopeContract`** (an `allowedFiles`/`forbiddenFiles` block on the prompt — the `scope-contract-guard` fails closed without one; for a READ-ONLY consult, a non-empty `forbiddenFiles` signals writes-nothing). The spawn-hand stays with you: a summoned roster consult must NOT dispatch the build chain (the `dispatch-route-guard` no-deep-cascade check; ε is the sole builder-dispatcher). Capture the returned envelope to a file, then write the completion record: `node scripts/sprint/epsilon-runtime.js record-inprocess --sprint <id> --role <role> --step <step> --evidence <file> [--elapsed-ms <n>]`. The record's `ok` is DERIVED FROM the real Agent-return bytes (0-byte → `ok:false`; no evidence file → REFUSED) — the SAME `ok:true` liveness `gauntlet-verify` reads, so an in-process reviewer lane is gated exactly like a CLI lane. **NEVER write the record without the Agent's real return** — there is no `ok:true` without a real spawn behind it (the operator-caught fake-green; ADR-0009 Increment B).
 
 Parse every result via `scripts/hooks/lib/providers.js#parseProviderJson`. Verify output is non-zero bytes and exit was 0 before advancing.
 
diff --git a/CODEX.md b/CODEX.md
index dc9f1ee2..f9c558ea 100644
--- a/CODEX.md
+++ b/CODEX.md
@@ -18,7 +18,7 @@
 - **tracker-completion-gate** — nothing blocks a Stop on a red tracker; run `validate.js` yourself before claiming done.
 - **smart-context / additionalContext** — no auto memory injection; read `TRACKER.md` + `DUMP.md` + the relevant `runtime/notes/*` explicitly.
 
-**2. NO HARNESS AGENT TOOL → NO IN-PROCESS TEAMMATES.** You cannot spawn α/β/ε/directors/leads as in-process agents (that path is Claude-harness-only, ED-041). You dispatch via the **CLI routes only**:
+**2. NO HARNESS AGENT TOOL → NO IN-PROCESS TEAMMATES.** You cannot spawn α/β/ε/directors/leads as in-process agents — **not because of ED-041** (that was a per-spec misstatement about Claude *subagents*, now retired per ADR-0014), but because **you are not a Claude-harness agent at all**: a non-Claude orchestrator (Codex/GPT) has no harness `Agent` tool, full stop. So you dispatch via the **CLI routes only**:
 - Build-chain Claude roles (builder/fixer/security-builder/backend-builder): `node scripts/dispatch-claude.js <role> <prompt-file> -w`
 - Cross-provider reviewers (qa-reviewer/backend-reviewer/security-reviewer): `node scripts/dispatch-agent.js <role> <prompt-file>` (pin the family with `--provider openai` / `--provider gemini` when a re-review must match the prior FAIL family).
 - You ARE a GPT/Codex executor, so a "Claude builder" dispatched via `dispatch-claude.js` is a cross-family worker for you — fine; the wrapper handles auth.
diff --git a/scripts/dispatch/dispatch-contract.js b/scripts/dispatch/dispatch-contract.js
index a49d9bc5..0ef2819c 100644
--- a/scripts/dispatch/dispatch-contract.js
+++ b/scripts/dispatch/dispatch-contract.js
@@ -507,14 +507,18 @@ function validateContractFile() {
         }
       }
     }
-    // ── alpha_only_shapes (ED-041): a RECOGNIZED annotation naming which of a
-    // mode's listed shapes are α-ONLY — only the TOP-LEVEL orchestrator (α, the ε
-    // conductor face) may spawn them (a teammate-spawned ε cannot call the Agent
-    // tool: "Agent is not available inside subagents"). It does NOT narrow class_shapes;
-    // it records WHO may use the shape. It must be an ARRAY whose entries are all
-    // KNOWN shapes (the same shape vocabulary as allowed_shapes); an unknown shape
-    // is a typo'd annotation and is REJECTED. Recognizing the key here keeps it from
-    // being silently ignored and lets the validator FAIL a malformed annotation.
+    // ── alpha_only_shapes (ADR-0014): a RECOGNIZED annotation naming which of a
+    // mode's listed shapes are α-ONLY. As of ADR-0014 NO shape is α-only — the array
+    // is RETAINED-BUT-EMPTY (`[]`): the in-process-agent roster is summonable by the ε
+    // conductor in ANY spawn context (top-level OR teammate-ε) supplying a
+    // scopeContract, because ED-041 ("Agent unavailable inside subagents") was a
+    // per-spec misstatement (a Claude subagent has Agent iff its spec lists it; ε's
+    // does). The key is kept (not removed) so a reversal is a one-line re-add. It does
+    // NOT narrow class_shapes; it records WHO may use the shape. It must be an ARRAY
+    // whose entries are all KNOWN shapes (the allowed_shapes vocabulary); an unknown
+    // shape is a typo'd annotation and is REJECTED — recognizing the key here keeps it
+    // from being silently ignored and lets the validator FAIL a malformed annotation
+    // (an EMPTY array is valid + the post-ADR-0014 expected state).
     if ("alpha_only_shapes" in profile) {
       const aos = profile.alpha_only_shapes;
       if (!Array.isArray(aos)) {

=== FILE: scripts/checks/consult-roster-no-dispatch.js (the no-cascade enforcer) ===
#!/usr/bin/env node
"use strict";

/**
 * consult-roster-no-dispatch.js — the no-deep-cascade enforcer (E-DISPATCH-PERFECT-001
 * W5 / ADR-0014). The DoD "enforced" item: when ε summons the in-process roster
 * directly (in any spawn context, per ADR-0014), the **spawn-hand stays with the
 * conductor** — a summoned roster CONSULT must NOT be able to dispatch the build chain
 * or cascade further. ε remains the SOLE builder-dispatcher.
 *
 * WHY A STRUCTURAL CHECK, NOT A HOOK (DoE judgment): the dispatch-route-guard PreToolUse
 * hook sees a SINGLE tool call with NO lineage/depth signal, so it cannot distinguish
 * ε's legitimate first-hop summon from a roster member's forbidden second-hop cascade
 * (both are identical single events). The REAL enforcement is STRUCTURAL: a role that
 * is summoned at a CONSULT/author hook-point (sprint step ∈ {plan, design}) must carry
 * a NO-DISPATCH tool-set (no `Bash`, no `Agent`) in its agent spec — then it CANNOT
 * dispatch, by construction, regardless of what its prompt says. The hook's existing
 * in-process-build-chain block is the runtime backstop.
 *
 * WHAT IT FIRES ON (β: "fires, not key-only" — rename-proof): the role's ACTUAL spec
 * frontmatter `tools:` (read from the .md the role-registry `spec` points at), JOINED
 * with the consult hook-points (sprint-hook-points.json × role-registry.json) — NOT a
 * hand-maintained role list a rename could no-op past. A consult role whose real spec
 * lists `Bash`/`Agent` is a violation.
 *
 * THE KNOWN RESIDUAL (β honesty floor — do NOT let it read green silently): `quality-lead`
 * is summoned at the `design` consult step AND carries `[Read,Grep,Glob,Bash,Agent]`
 * (its OTHER job is pod-coordination — fanning out qa-reviewers/design-quality/test-runner
 * to GATHER EVIDENCE, a sanctioned one-hop dispatch). One spec can't be tool-restricted
 * per-hook-point, so its design-consult use is trusted-read-only via the scopeContract
 * (writes-nothing). This is recorded as an EXPLICIT, ED-debt-tracked exemption (ED-065)
 * and REPORTED as a known-exemption line — NOT silently passed. A future-proof one-hop
 * reviewer-dispatch assertion (a summoned pod-coordinator may dispatch ONLY its own
 * pod's reviewers) is the ED-065 follow-up.
 *
 * EXIT: 0 = clean (only the documented exemption present), 1 = a NEW pure-consult role
 * gained a dispatch tool, 2 = runner error (FAIL-CLOSED — a scanner that errors must
 * NOT read green). `--json` for machine output.
 *
 *   node scripts/checks/consult-roster-no-dispatch.js [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const NAME = "consult-roster-no-dispatch";

// Consult/author lifecycle steps — a role summoned here is a READ-ONLY advisor.
const CONSULT_STEPS = new Set(["plan", "design"]);
// Dispatch-capable tools — their presence in a consult role's spec = a cascade hole.
const DISPATCH_TOOLS = ["bash", "agent"];
// The ONE documented dual-role exemption (β honesty floor + ED-065). quality-lead's
// design-consult is trusted-read-only (scopeContract); its dispatch tools serve its
// gauntlet pod-coordination. Keyed by EXACT role id — a different role gaining a
// dispatch tool is NOT exempt and fails the gate.
const KNOWN_EXEMPTIONS = new Map([
  ["quality-lead", "ED-065: dual-role pod-coordinator — design-consult is trusted-read-only via scopeContract; [Bash,Agent] serve the gauntlet one-hop evidence fan-out. Follow-up: a one-hop reviewer-dispatch assertion."],
]);

/** Read a role's ACTUAL spec frontmatter `tools:` as a lowercased token set. Returns
 *  { tools:Set, source:"frontmatter"|"agents-list"|"none", specPath } — fires on the
 *  real spec, not a registry field a rename could desync. */
function readSpecTools(specRel) {
  const out = { tools: new Set(), source: "none", specPath: specRel };
  if (!specRel) return out;
  const abs = path.isAbsolute(specRel) ? specRel : path.join(ROOT, specRel);
  let txt;
  try {
    txt = fs.readFileSync(abs, "utf8");
  } catch {
    return out; // spec unreadable — caller treats an empty tool-set as "can't confirm"
  }
  // Primary: a YAML/markdown `tools:` frontmatter line (e.g. `tools: Read, Grep, Glob`).
  let m = txt.match(/^tools:\s*(.+)$/m);
  if (m) {
    out.source = "frontmatter";
  } else {
    // Fallback: the parenthetical `(Tools: Read, Grep, ...)` form some specs use.
    m = txt.match(/\(Tools:\s*([^)]+)\)/i);
    if (m) out.source = "agents-list";
  }
  if (m) {
    for (const t of m[1].split(/[,\s]+/)) {
      const tok = t.trim().toLowerCase().replace(/[\[\]"'`]/g, "");
      if (tok) out.tools.add(tok);
    }
  }
  return out;
}

/** PURE CORE: given the registry + hook-points docs, return the consult roles whose
 *  spec carries a dispatch tool, split into { violations, exemptions, scanned }.
 *  Injectable (regDoc, hpDoc, toolReader) for the P5 sealed-fixture test. */
function evaluate(input) {
  const regDoc = (input && input.regDoc) || {};
  const hpDoc = (input && input.hpDoc) || {};
  const toolReader = (input && input.toolReader) || ((spec) => readSpecTools(spec).tools);

  const roles = regDoc.roles || regDoc;
  const rows = hpDoc.attachments || hpDoc.rows || hpDoc.hook_points || (Array.isArray(hpDoc) ? hpDoc : []);

  // The consult-summonable role ids: any role attached at a CONSULT step.
  const consultRoles = new Set();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (r && r.role && CONSULT_STEPS.has(r.step)) consultRoles.add(r.role);
  }

  const violations = [];
  const exemptions = [];
  let scanned = 0;
  for (const roleId of consultRoles) {
    const entry = roles[roleId];
    const spec = entry && entry.spec;
    const tools = toolReader(spec, roleId) || new Set();
    scanned++;
    const dispatchTools = DISPATCH_TOOLS.filter((t) => setHas(tools, t));
    if (dispatchTools.length === 0) continue; // clean — no dispatch capability
    if (KNOWN_EXEMPTIONS.has(roleId)) {
      exemptions.push({ role: roleId, tools: dispatchTools, reason: KNOWN_EXEMPTIONS.get(roleId) });
    } else {
      violations.push({
        role: roleId,
        tools: dispatchTools,
        spec: spec || "(no spec in registry)",
        detail:
          `consult-summonable role '${roleId}' (at a plan/design hook-point) carries dispatch tool(s) ` +
          `[${dispatchTools.join(", ")}] — a summoned consult must NOT be able to dispatch the build ` +
          `chain or cascade (ADR-0014 spawn-hand-stays-with-conductor). Remove Bash/Agent from its spec, ` +
          `or (if it is a genuine dual-role pod-coordinator) add an explicit KNOWN_EXEMPTIONS entry + ED debt.`,
      });
    }
  }
  return { ok: violations.length === 0, violations, exemptions, scanned };
}

function setHas(set, v) {
  // tolerant: accept a Set OR an array OR a comma-string of tools.
  if (set instanceof Set) return set.has(v);
  if (Array.isArray(set)) return set.map((x) => String(x).toLowerCase()).includes(v);
  return String(set || "").toLowerCase().includes(v);
}

function run() {
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude/agents/_org/role-registry.json"), "utf8"));
  const hp = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude/agents/_org/sprint-hook-points.json"), "utf8"));
  return evaluate({ regDoc: reg, hpDoc: hp });
}

module.exports = { evaluate, readSpecTools };

if (require.main === module) {
  const JSON_OUT = process.argv.includes("--json");
  let res;
  try {
    res = run();
  } catch (e) {
    // FAIL-CLOSED (BC-16): a scanner that errors must NOT read green.
    const msg = e && e.message ? e.message : e;
    if (JSON_OUT) console.log(JSON.stringify({ check: NAME, ok: false, error: String(msg) }));
    else console.error(`[${NAME}] runner error (fail-closed): ${msg}`);
    process.exit(2);
  }
  if (JSON_OUT) {
    console.log(JSON.stringify({ check: NAME, ...res }));
  } else if (res.ok) {
    console.log(
      `OK   [${NAME}] no consult-summonable role carries a dispatch tool ` +
        `(${res.scanned} consult role(s) scanned; ${res.exemptions.length} documented exemption(s))`,
    );
    for (const ex of res.exemptions) {
      console.log(`  ~ EXEMPT ${ex.role} [${ex.tools.join(", ")}] — ${ex.reason}`);
    }
  } else {
    console.error(`FAIL [${NAME}] ${res.violations.length} consult-summonable role(s) carry a dispatch tool (cascade hole):`);
    for (const v of res.violations) console.error(`  - ${v.role} [${v.tools.join(", ")}] (${v.spec})\n      ${v.detail}`);
    for (const ex of res.exemptions) console.error(`  ~ EXEMPT ${ex.role} [${ex.tools.join(", ")}] — ${ex.reason}`);
  }
  process.exit(res.ok ? 0 : 1);
}

=== END ===
