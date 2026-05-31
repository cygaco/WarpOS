# Wave 1 · S1.3 — Gamma integration phase (design note)

_FINAL-PLAN §6 Wave 1 S1.3 + §7 defaulted decision #2: make Gamma OWN an explicit
integration phase so the FE↔BE seam is governed BEFORE the pilot discovers
shared-file pain. Built on CANONICAL (HEAD `ea12671`), where S1.2 arbitration
(`scripts/arbitration/emit.js`/`resolver.js`) and the S2.3 FE/BE split
(`frontend-builder` + `backend-builder` + `_build-core`) already live._

## Why this exists (the named risk)

§8 top-risks (do-nots): "**FE/BE integration on shared files**." S2.3 split the single
`builder` into `frontend-builder` (owns `src/components/**`, `src/app/**`) +
`backend-builder` (owns `src/app/api/**`, `src/lib/**` non-UI, **produces the typed
contract FE consumes**). Two builders editing in parallel worktrees means: shared
`src/lib` / config / types get concurrent edits; the FE consumes types the BE produces
(shape drift = silent break); env vars + data contracts at the seam can go missing; and
nobody runs a thin end-to-end check across the boundary. The S2.3 notes + both builder
specs already POINT at "the S1.3 Gamma integration phase owns the FE/BE shared-file seam"
— this sprint makes that owner real, with an enforcer that REJECTS (not lints).

Principle: **own-the-integration-seam** — the producer (BE) defines the shape; the
consumer (FE) adapts; never the reverse (mirrors `02-oneshot/.system/integration-map.md`
"Producer defines the shape. Consumer adapts. Never the reverse.").

## Deliverable 1 — the integration-phase RESPONSIBILITY (doc)

Added as a new section in `.claude/agents/00-alex/gamma.md` ("## Integration phase
(multi-builder features) — WG-S1.3") + a pointer in `.claude/agents/01-adhoc/.system/protocol.md`
(a numbered protocol step between the gauntlet and the test pilot). The oneshot side
(`02-oneshot/.system/protocol.md`) already runs the arbitration resolver at run-end; the
integration gate's oneshot path emits into that same resolver, so no oneshot protocol
rewrite is needed — a one-line pointer is added there too.

**WHEN it runs:** AFTER the FE + BE builders return, BEFORE the gauntlet clears a
**multi-builder** feature (>1 builder touched the unit). Single-builder features skip it
(nothing to integrate — the gate treats `builders.length < 2` as N/A).

**WHAT it owns (the 5 concerns from the brief):**
1. **Shared files** — reconcile concurrent edits to shared `src/lib`/config/types. Each
   shared file edited by BOTH FE+BE must carry a reconciliation record (who merged it, how
   the conflict was resolved). No record on a both-edited shared file = REJECT.
2. **Generated types** — assert each FE-consumed type matches the BE-produced shape
   (producer defines, consumer adapts). An FE-consumed type with no BE producer, or a
   shape mismatch, = REJECT.
3. **Env / contracts** — env vars + data contracts at the seam are present + consistent. A
   declared seam contract missing a required field = REJECT.
4. **Smoke tests** — a thin end-to-end smoke across the FE↔BE boundary exists for the
   feature. Absent on a multi-builder feature = REJECT.
5. **FE/BE merge behavior** — explicit merge order + conflict policy (BE-first is the
   default: the producer lands before the consumer so the consumer adapts to a real shape;
   `own-the-integration-seam`).

**Acceptance gates (REJECT, not lint):** the phase runs
`scripts/checks/integration-seam-gate.js <manifest>` and treats a non-zero exit as a
BLOCKING failure — exactly like a gauntlet reviewer fail. exit 1 = reconcilable defects
(dispatch a fixer / re-run the relevant builder, max 3 like the gauntlet); exit 2 =
internal/fail-closed error (HALT, never proceed green).

## Deliverable 2 — the acceptance-gate ENFORCER

`scripts/checks/integration-seam-gate.js` (+ `.test.js`). Mirrors `role-parity-scan.js`
exactly: pure `evaluate({ manifest, typeShapeResolver })` core + injectable seams + CLI
(`--json`, exit 0/1/2 fail-closed) + a sibling bite-test proving it bites each reject
class + the arbitration path. Reject-not-lint.

### The integration manifest (the gate's input)

A per-feature JSON the orchestrator (Gamma in adhoc, Delta in oneshot) writes describing
the multi-builder integration surface. Per-run ⇒ lives under
`runtime/integration/<feature>/manifest.json` (walk-skipped, NOT tracked — per memory
`project_perrun_artifacts_runtime_not_project`: per-run artifacts go under `runtime/`,
never `.claude/project/`). Shape (v0.1, revisable like the S0.2 contracts):

```jsonc
{
  "feature": "auth",
  "mode": "adhoc",                       // "adhoc" | "oneshot" — drives the arbitration path
  "builders": ["frontend-builder", "backend-builder"],  // who touched the unit
  "shared_files": [
    { "path": "src/lib/types.ts",
      "edited_by": ["frontend-builder", "backend-builder"],
      "reconciled_by": "gamma_integration",       // REQUIRED iff edited_by has >1 distinct builder
      "reconciliation": "BE shape kept; FE import updated" }
  ],
  "type_contracts": [
    { "name": "Session",
      "produced_by": "backend-builder",           // the producer (REQUIRED — own-the-seam)
      "consumed_by": ["frontend-builder"],
      "producer_path": "src/lib/types.ts",
      "consumer_paths": ["src/components/AuthGate.tsx"],
      "shape_match": true }                        // FE-consumed shape == BE-produced shape
  ],
  "seam_contracts": [
    { "name": "auth-env",
      "kind": "env",                              // "env" | "data"
      "required_fields": ["JWT_SECRET", "SESSION_TTL"],
      "present_fields": ["JWT_SECRET", "SESSION_TTL"] }
  ],
  "smoke_test": "_requirements/04-features/auth/tests/integration.spec.ts",
  "merge": { "order": ["backend-builder", "frontend-builder"], "conflict_policy": "producer-wins" }
}
```

### REJECT classes (each has a bite-test)

| # | Reject class | Condition |
|---|---|---|
| 1 | `shared-file-unreconciled` | a `shared_files[]` entry edited by ≥2 distinct builders with no `reconciled_by` (+ `reconciliation` text) |
| 2a | `consumed-type-no-producer` | a `type_contracts[]` entry with `consumed_by` non-empty but no `produced_by` |
| 2b | `type-shape-mismatch` | a `type_contracts[]` entry where `shape_match !== true` (or, when a `typeShapeResolver` is injected/available, the resolver reports producer≠consumer shape) |
| 3 | `seam-contract-missing-field` | a `seam_contracts[]` entry with a `required_fields` member absent from `present_fields` |
| 4 | `smoke-test-absent` | a multi-builder feature (`builders.length >= 2`) with no `smoke_test` (or a declared path that doesn't resolve, when a `smokeResolver` is injected) |
| 5 | `merge-order-incoherent` | `merge.order` omits a builder that actually edited a shared file, or names a builder not in `builders[]` (a merge plan that can't be executed) |

**N/A short-circuit:** `builders.length < 2` ⇒ nothing to integrate ⇒ `evaluate` returns
`{ applicable:false, errors:[] }` ⇒ exit 0 (single-builder features don't need the phase).

**Malformed manifest** (not an object, missing `feature`/`builders`) ⇒ thrown ⇒ exit 2
(fail-closed; a gate that errors must never read green — the false-green bug class the
role-parity scan also guards).

### The arbitration path (oneshot, no α/β)

In oneshot there is no α/β to escalate an UNRESOLVED conflict to. Per FINAL-PLAN §3 +
the S1.2 mechanism: when `mode === "oneshot"` AND the gate finds reject(s), it calls
`scripts/arbitration/emit.js#emit()` with:
- `unit` = the feature,
- `owner` = `"gamma_integration"` (the brief's required owner),
- `decision` = a summary of the unresolved integration conflict,
- `rationale` = the reject list,
- `precedenceBasis` = `"build_spec.precedence=70 (producer/BE shape leads; own-the-integration-seam)"`,
- `artifactPrecedence` = **70** (the `build_spec` rank from `schemas/contracts/build_spec.schema.json` — the seam is governed by what is actually built; highest in the chain so the integration concern leads its per-unit bundle),
- `arbitrationNeeded` omitted ⇒ defaults TRUE (β Q2 fail-closed: uncertain ⇒ park).

The emitted `decision_record` lands in `runtime/arbitration/<unit>/<id>.json`; the
existing run-end `scripts/arbitration/resolver.js` (already wired as the oneshot run-end
ship gate, oneshot protocol step 11) then BLOCKS ship-ready until α/β resolve it. So the
integration gate does NOT reimplement decision-record writing — it reuses S1.2's `emit()`,
and S1.2's resolver does the parking. In **adhoc**, there IS an α/β: the gate just returns
non-zero and Gamma surfaces the reject to α (no emit — α/β are live).

`--emit-on-conflict` CLI flag gates the emit so the bite-test can exercise the path
deterministically (point `CLAUDE_PROJECT_DIR` / the emit store at a temp dir, run with the
flag + a oneshot manifest, assert a record was written). Without the flag the CLI still
reports the rejects (exit 1) but does not write a record — keeps a dry `--json` run
side-effect-free.

## What S3.1 (the pilot) will exercise

The pilot is a cross-domain oneshot whose exit criteria (§6 S3.1) require contract +
routing + visual/mobile QA + evidence + resonance evals to pass. The integration gate adds
a **seam gate** the pilot's multi-builder feature must clear: Delta writes the integration
manifest after the FE+BE builders return, runs `integration-seam-gate.js` in oneshot mode;
any unresolved seam conflict emits a `gamma_integration` `decision_record` that the run-end
resolver surfaces — so the pilot cannot declare "done" with an un-reconciled shared file,
an FE-consumed type with no BE producer, a missing seam field, or no boundary smoke test.
This is the structural fix for the §8 "FE/BE integration on shared files" risk: the pilot
proves the seam is governed, instead of discovering shared-file pain by hand.

## Constraints honored

- **No `builder`→FE/BE dispatch MIGRATION** — `builder` stays the live oneshot route
  (S2.3 Option A). This sprint adds an integration *phase*, touches no dispatch routing.
- **No shared-contract edits** — org-map.json, catalog.js, team-guard.js,
  role-parity-scan.js, providers.js, the manifests are untouched. No REGISTRY DELTA needed:
  the gate is a NEW `/scan:*`-style script that reads its own per-run manifest; it does not
  add a role, a routing entry, or a contract schema. (A future `/scan:integration-seam`
  skill wrapper could be added under `.claude/commands/scan/` by α, but that's a skill, not
  a registry change — left for α's integration pass; the script is the enforcer.)
- **Reuses `scripts/arbitration/emit.js`** for escalation — no reimplemented
  decision_record writing.
- **Mirrors the role-parity enforcer style** — pure `evaluate()` + injectable seams +
  sibling bite-test, exit 0/1/2 fail-closed, reject-not-lint.
- Scope: gamma.md + adhoc protocol pointer (+ a one-line oneshot pointer) + the new
  `integration-seam-gate.js`/`.test.js` + this note. Nothing else. Left uncommitted for α.

## Enforcement-debt note (policy needs an enforcer)

The gate enforces manifest CONTENT. It cannot enforce that Gamma/Delta actually WRITES the
manifest for every multi-builder feature (a missing manifest = the phase silently skipped).
Two backstops make the skip self-detecting: (a) the gamma.md/protocol steps make manifest
authoring a required step of the phase; (b) the oneshot run-end resolver already gates
ship-ready — but it only catches an EMITTED record, not an un-run gate. The residual gap
("did the integration phase run at all for this multi-builder feature?") is logged as
enforcement debt for α to wire a presence-check (e.g. a oneshot gate that asserts a
`runtime/integration/<feature>/manifest.json` exists for every feature whose diff touched
both FE and BE scopes) — analogous to the gauntlet `dispatch-completions` liveness gate.
