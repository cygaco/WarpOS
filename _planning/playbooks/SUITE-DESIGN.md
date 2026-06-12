# Playbook Suite — Design (S-LC-12, E-LIFECYCLE-001 Wave 5)

> **Status: DESIGN ONLY.** Per §22 #6 (operator-resolved 2026-06-09): playbooks are **reference procedures** (the low-risk default). An executable `/playbook:run` is designed here but **deferred** — NOT built in this epic. `tracker:` E-LIFECYCLE-001. This doc lives in the `_planning/` lifecycle store (S-LC-08): manifest-excluded + MUST_NOT_SHIP via the `_planning/` prefix.

## 1. What a playbook is (and is not)

A **playbook** is a named, ordered **operating procedure** for a recurring multi-step situation — "what to do, in what order, with which skills/gates, and what 'done' looks like." It is distinct from the three existing doctrine/skill layers:

| Layer | Artifact | Nature | Example |
|---|---|---|---|
| **Doctrine** | `playbook.md` plays (`/playbook:add`) | a single named PRINCIPLE, example-anchored | "Product priority over severity" |
| **Skill** | `.claude/commands/**` | one executable procedure (one tool) | `/sprint:plan`, `/epic:fold` |
| **Playbook (this)** | `_planning/playbooks/<name>.md` | an ORDERED COMPOSITION of skills + gates + judgment for a situation | "Launch-readiness playbook" |
| **Mode** | `/mode:*` + registry | the standing posture (team, bindings) a playbook runs inside | sprint mode |

Today's `/playbook:add` writes **doctrine plays** to `playbook.md` — that stays. This suite adds **situational playbooks** as reference docs under `_planning/playbooks/`.

## 2. The decision: reference-procedures, not executable (now)

§22 #6 resolved this as a taste/risk call. **Reference** wins for v1 because:
- A reference playbook is read by a human/agent and followed with judgment — it cannot mis-fire, cannot skip an approval, cannot brick a mode switch. Zero blast radius.
- An **executable** `/playbook:run` that chains skills + auto-satisfies gates is exactly the `/sprint:full` risk class (it can auto-approve within a preset). That deserves its own epic with its own autonomy preset + hard ceilings, not a fold-in here.
- The reference form is enough to capture the operating knowledge now; the executable form is an optimization once the procedures are proven by use.

**Deferred design (`/playbook:run`):** when built, it would (a) parse a playbook's ordered steps, (b) map each step to a skill invocation OR a human-gate, (c) run under a bounded autonomy preset (like `/sprint:full`'s), (d) HALT at every confirm-class/approval step, (e) never bypass the CLAUDE.md hard ceilings. It is the playbook analog of `/sprint:full`. Out of scope for E-LIFECYCLE-001.

## 3. The relationship map (skill ↔ playbook ↔ mode ↔ epic ↔ sprint)

```
            mode (posture: team + bindings + gates)
              ▲ runs inside
   playbook (ordered situation procedure)
   ├─ composes → skills (/sprint:plan, /epic:plan, /scan:*, /warp:health …)
   ├─ gated by → the lifecycle gates (mode-init:gate, mode-lifecycle-guard, the enforcers)
   └─ produces → epic/sprint artifacts (a plan, a release, a reconciliation)
              ▲ tracked by
            TRACKER (authority) ← epics/sprints ← _planning lifecycle store
```

- A **playbook references skills**, never reimplements them (same EXTEND-not-rebuild discipline as the epic).
- A **playbook runs inside a mode** — e.g. the launch-readiness playbook runs in sprint mode; the incident-response playbook may run in solo mode.
- A **playbook's output is an epic/sprint artifact** — it doesn't invent a new state store; it drives the existing TRACKER ↔ _planning ↔ epics/sprints spine (S-LC-08).

## 4. The five candidate playbooks (reference scaffolds)

Each would be authored as `_planning/playbooks/<name>.md` with: Situation → Preconditions (mode/team/bindings) → Ordered steps (each naming its skill or human-gate) → Gates that must pass → Definition of done → Rollback.

1. **launch-readiness** — prototype → monetizable (composes `/bootstrap:lastmile`, `/scan:full`, release gates). Runs in sprint mode. Authored in `launch-readiness-playbook.md`.
2. **provider-setup** — the T1/T2/T3 provider onboarding flow (composes `/warp:health`, `provider-tier-check.js`, the §14 confirm-class steps). The natural consumer of S-LC-10. Authored in `provider-setup-playbook.md`.
3. **mode-switch** — the safe-mode-transition procedure (the human-readable companion to `mode-set.js` + `mode-lifecycle-guard`): verify-terminate old team → resolve target → spawn → verify → bind. The reference form of the S-LC-01..05 machine. Authored in `mode-switch-playbook.md`.
4. **incident-response** — a gate/enforcer fired or a reap/false-green was caught: triage → diagnose → fix-cycle → re-review → reconcile. Codifies this session's own loop. Authored in `incident-response-playbook.md`.
5. **retro-loop** — sprint/epic close → `/sprint:retrospective` / `/learn:deep` → `/learn:integrate` → reconcile TRACKER. Closes the retro→learning leak noted in the dispatch-shape session. Authored in `retro-loop-playbook.md`.

The playbooks are reference procedures only. `/playbook:add` (doctrine) remains separate; executable `/playbook:run` remains deferred.

## 5. Enforcer (per the policy-needs-an-enforcer rule)

The reference-playbook layer is low-risk (docs read with judgment), so its enforcer is light: `scripts/checks/playbook-suite-coverage.js` asserts each authored `_planning/playbooks/*-playbook.md` carries the required sections (Situation/Preconditions/Steps/Gates/DoD/Rollback), states that it is a reference procedure only, and cites this design. It is wired into `/scan:full` as a direct planning-store integrity invocation. The executable `/playbook:run`, when built, inherits `/sprint:full`'s hard-ceiling enforcement.

## 6. References
- §8.12 (Playbook Suite), §22 #6 (operator-resolved: reference-procedures), §8.13 (`_planning` integration — where playbooks live).
- Sibling artifacts: `playbook.md` (doctrine plays), `/sprint:full` (the executable-chain risk class `/playbook:run` would join).
- Epic: E-LIFECYCLE-001 Wave 5 (S-LC-12 capstone).
