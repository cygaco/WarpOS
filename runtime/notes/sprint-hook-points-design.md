# Sprint Hook-Points — declarative agent extension architecture

Operator directive (2026-06-02): "During sprints I want hook points for our agents.
When we write tickets, the designer should come in. A hook point for each step, so as
we add agents they can be easily wired in, and we can easily find gaps."

This is the GENERALIZED form of the (A) manager-set router + (B) event-contract that
β + DoP already approved as the "Wire the judgment layer" follow-on. It elevates the
narrow router into a first-class extension framework.

---

## 1. The problem today (why agents are hard to add)

The sprint pipeline invokes agents at HARD-CODED points:
- `sprint:design` = script-driven + a generic Beta review. It consults NONE of the
  managers that name it as their consumer (product-lead, DoE, product-designer, DoQA).
- The build gauntlet (Gamma) = a fixed set {reviewer, compliance, qa, redteam} + visual-review.
- Adding an agent = editing orchestrator prose in N places; there is no single place
  that says "who runs at which step." Result: orphans (DoE, product-designer,
  design-quality) sit unwired, and there is NO way to ask "which step has no agent?"
  or "which agent has no home?"

## 2. What's being built NOW (the first instances of the pattern)

1. **W1** — `design-quality` (the org's named design authority, previously uncalled)
   wired into the gauntlet hook point for UI units, with a ramp (advisory→baseline→block)
   and a telemetry record. The FIRST "an agent attaches at a sprint step" wiring.
2. **Router model (A)** — sprint-composition → manager-set: `product-lead + Beta` always;
   `DoE / product-designer / DoQA / design-quality` conditional by unit-type + risk.
3. **Enforcer** — baseline-dated `scan:sprint-manager-consult`: detects an applicable
   agent that did NOT run at its step (gap-finding, one direction).
4. **Event-contract (B)** — each `needs_orchestration` seam emits a typed event;
   consumers (cockpit buttons OR agents) attach declaratively, not by hard-code.

These are literally the first rows + first enforcer of the hook-point system below.

## 3. The generalization: named hook points + declarative registry + bidirectional coverage

**(a) Sprint lifecycle = ordered, NAMED steps, each a HOOK POINT:**
`plan → design (ticket-writing) → build → gauntlet → release → retro`

**(b) A declarative REGISTRY — one row per agent attachment:**
```
{ role, step, condition (unit-type | risk | domain), mode (advisory|block), order }
```
Adding an agent = adding a ROW, never editing the orchestrator. (Same shape the
`_guides/registry.json` + `guide-integration.jsonl` already use for guide→bootstrap
anchors — proven pattern, different surface.)

**(c) Orchestrator reads the registry** at each step and dispatches the registered
agents whose `condition` matches the sprint's composition; captures each result as a
telemetry record (mirrors `gauntlet-verify` / `dispatch-completions.jsonl`).

**(d) Coverage enforcer (`scan:sprint-hook-coverage`) asserts BOTH directions** — this
is the "easily find gaps" the operator wants, made self-detecting:
- forward: every agent declared for a step actually RAN (record) OR a logged debt →
  "this step is missing its agent."
- reverse: every agent is registered at some step / every step's declared agents exist →
  "this agent is ORPHANED" / "this step has NO agent."

## 4. Why it's cheap — three existing precedents already in the codebase

1. **guides:registry.json + guide-integration.jsonl + /guides:coverage** — the EXACT
   pattern (declarative anchor registry + integration ledger + fail-closed coverage
   enforcer), already shipped, for guides→bootstrap. Generalize to agents→sprint-steps.
2. **org-map.json** — already declares agent↔surface ownership (`is_named_design_authority`,
   each manager's named consumers). Half the registry already exists as data.
3. **systems-sync hook** — auto-registers new components on file edit (119/119
   auto-validated). The discovery/registration mechanism is already mechanized.

So the framework is small: (a) a sprint-hook-point registry (new, ~1 JSON file),
(b) the orchestrator reads it (sprint:design + gamma/delta), (c) the bidirectional
coverage enforcer (generalize `scan:sprint-manager-consult`). W1 + the router are the
first concrete rows.

## 5. The hook-point map (concrete)

| Sprint step (hook point) | Agents that register | Condition to fire |
|---|---|---|
| `plan` | director-of-product / product-lead | always (strategy/sequencing) |
| `design` (ticket-writing) | product-lead (authoring) · DoE (architecture/build_spec) · **product-designer (UX of stories)** · DoQA (QA plan) · copy-lead | UI→designer · code→DoE · risk≥med→DoQA · marketing→copy |
| `build` | builder / frontend-builder / backend-builder | by unit-type (FE/BE) |
| `gauntlet` | reviewer · compliance · qa · redteam · visual-review · **design-quality** | always + UI→visual-review/design-quality |
| `release` | release reviewers (diff-model) | always |
| `retro` | learner | oneshot |

## 6. The operator's example, walked through

"When we write tickets, the designer comes in" → the `design`/ticket-writing step is a
hook point; **product-designer registers there with condition `unit-type=UI`**. The
router dispatches it whenever the sprint has UI units. The coverage enforcer flags a UI
sprint whose tickets were written WITHOUT the designer's telemetry record. Add a brand-new
agent later (say a `data-modeler`) = ONE registry row at the step it belongs to; the
enforcer immediately knows, every sprint, whether it ran — and flags it the day it's
declared-but-never-fires or fires-with-no-home.

## 7. Status / sequencing

- Landing THIS session (the first rows + one direction of the enforcer): W1
  (design-quality at the gauntlet hook) + the router's always-on product-lead+Beta.
- The full framework — the registry file + orchestrator-reads-registry +
  bidirectional `scan:sprint-hook-coverage` — is the **"Wire the judgment layer"
  follow-on** sprint (after S1-S5 + S4), per β + DoP. This note IS that follow-on's design.
- The deepest connection (DoP): every gap this session is "a contract claimed but never
  enforced." The hook-point registry + bidirectional coverage is the SYSTEMIC cure for
  that whole class on the agent↔sprint surface — not three fixes, one move.
