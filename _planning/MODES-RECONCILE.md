# Modes ↔ Org Reconciliation — v1.1 — 2026-05-30

## Two axes
- **Modes** = *how a run executes* (Solo / Adhoc / Oneshot) — the autonomy/orchestration level.
- **Org** = *who owns judgment + who does the work.*
They don't compete: **modes are the stage; the org is the cast.** A mode says "how autonomous + who orchestrates"; the org says "which domain's people are in this scene."

## The friction
All three modes today only build **one kind of thing: code** (Gamma/Delta dispatch a builder → the code gauntlet). They can't "produce a campaign," "design a screen," or "build an audience dossier." Reconcile by generalizing **build modes → work modes.**

## Per-mode mapping
- **Solo** — unchanged. Quick one-offs; Alpha can consult one Director directly. Org mostly dormant.
- **Adhoc (interactive)** — the org's **live home**: β gates; the relevant Director/Lead judges **live**; γ dispatches the domain's doers through that domain's gauntlet. Cast swaps by domain:
  - feature → FE/BE builder + code gauntlet
  - screen → Product Designer + design-quality gauntlet
  - campaign → Growth/Copy + chiefing/no-invented-data gauntlet
  - dossier → research engine + source-attribution/no-PII gauntlet
- **Oneshot (autonomous)** — the **full-pipeline launch** (the pilot): δ runs research → message → design → build → creative → iterate, no α/β in the loop.

## The crux: directors participate differently per mode
- **Adhoc:** directors are **live-consulted** (there's an α/β to ask).
- **Oneshot:** no α/β → director judgment must be **encoded as contracts + enforced gauntlet checks.** → **In autonomous mode, a manager only exists as an enforcer.**
- **Enforcers must REJECT bad work, not lint it** (GPT). Generic "principles as checklists" become ceremonial. Oneshot enforcers must be specific enough to **fail real defects**, and must have an explicit **fail-closed → "arbitration-needed" record** state (the oneshot stand-in for α/β escalation) when contracts conflict or confidence is low. Artifact contracts must declare **precedence** so per-domain gauntlets can't deadlock.

## Concrete reconciliation work
1. Generalize **γ/δ → domain-aware dispatch** (pick the doers + gauntlet for the unit's domain).
2. **Per-domain gauntlets** — design / marketing / research each get their own checks; engineering keeps today's.
3. **Repartition agents by domain** — today `01-adhoc/` + `02-oneshot/` duplicate each role; don't 2× every new role. **One manifest/check owns role parity** or repartitioning creates registry drift.
4. Extend **role registry / team-guard** for the new roles + which orchestrator/mode dispatches them. Registry files: `scripts/dispatch/catalog.js`, `scripts/dispatch/state.js`, `scripts/hooks/lib/providers.js`, `scripts/hooks/team-guard.js`; parity via `scripts/checks/dispatch-routing-parity.js`.
5. Wire Directors/Leads **two ways**: live-consult (adhoc) + encoded-as-enforcers (oneshot).

## Naming
Once runs aren't only code, **"build modes" → "work modes"** (or runs carry an explicit `domain`) — stops the engineering assumption from sneaking back in.

## Implication for the plan
The pilot is a **cross-domain oneshot** → "teach Delta to run a *launch*, not just a code skeleton" is itself a chassis item (lands across Wave 1 + Wave 3).
