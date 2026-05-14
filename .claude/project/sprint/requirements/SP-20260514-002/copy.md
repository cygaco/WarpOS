# COPY — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`
**PRD:** `prd.md`

## C-1 — `routing.js record` success (linked story `S-1`)

**Context:** stdout when a trace row is appended successfully.
**Text:**

> recorded: phase=<phase> artifact=<artifact-id> sprint=<sprint-id> model=<provider:model> diff_reviewer=<provider:model|none> evidence=<ok|single_vendor_session>

**Notes:** Quiet by default; one line. `--verbose` adds the resolved trace path.

## C-2 — `routing.js record` model/class mismatch (linked story `S-1`)

**Context:** stderr when the supplied `--model` is not declared in the `model_class` for the phase.
**Text:**

> routing: model <provider:model> not in class <class-name> for phase <phase>.
> declared providers for <class-name>: <p1>, <p2>, <p3>.
> fix: re-run with a model from the declared list, or update <policy-path>#model_classes.<class-name>.

**Notes:** Exit 1. Names the exact policy key the operator would edit.

## C-3 — `routing.js record` single-vendor fallback (linked story `S-1`)

**Context:** stderr (non-fatal) when diff_review is required by the phase but no second vendor is configured.
**Text:**

> routing: diff_review required for phase <phase>, but no second vendor available.
> recorded with evidence=single_vendor_session. logged to <decision-ledger>.

**Notes:** Exit 0. Trace row carries `evidence: single_vendor_session` and a decision-ledger pointer.

## C-4 — `routing.js check` missing trace (linked story `S-2`)

**Context:** stderr when no matching row exists.
**Text:**

> routing: no trace row for phase=<phase> artifact=<artifact-id> sprint=<sprint-id>.
> fix: re-run the artifact-producing command, or record manually with `node scripts/sprint/routing.js record --phase <phase> --artifact <artifact-id> --sprint <sprint-id> --model <provider:model>`.

**Notes:** Exit 1.

## C-5 — `routing.js coverage` summary (linked story `S-3`)

**Context:** stdout. One-line summary plus per-phase table.
**Text:**

> sprint=<sprint-id> coverage: <n>/<total> required phases (<percent>%). missing: <phase-list-or-none>.
> phases:
>   planning           <pass|missing>  model=<provider:model>  diff_review=<ok|single_vendor_session|missing>
>   plan_contract_review  <pass|missing>  ...
>   design             ...
>   execution          ...
>   qa                 ...
>   redteam            ...
>   release            ...
>   retrospective      ...

**Notes:** Optional phases not shown unless `--include-optional`. Exit non-zero when any required phase is missing.

## C-6 — `sprint-routing-guard` warn message (linked story `S-10`)

**Context:** stderr when `enforcement.mode = warn` and a trace is missing.
**Text:**

> routing-guard (warn): write to <artifact-path> has no matching trace row.
> sprint=<sprint-id> expected phase=<inferred-phase>.
> proceed allowed (soft rollout until <soft_rollout_until>). To silence, record the trace.

**Notes:** Exit 0 (proceed). Surfaced once per session per artifact.

## C-7 — `sprint-routing-guard` block message (linked story `S-10`)

**Context:** stderr when `enforcement.mode = block` and a trace is missing.
**Text:**

> routing-guard: BLOCKED — write to <artifact-path> requires a matching trace row first.
> sprint=<sprint-id> expected phase=<inferred-phase>.
> fix: `node scripts/sprint/routing.js record --phase <inferred-phase> --artifact <artifact-id> --sprint <sprint-id> --model <provider:model>`

**Notes:** Exit 2 (PreToolUse block).

## C-8 — `sprint-routing-guard` exempted closed sprint (linked story `S-10`)

**Context:** stderr (debug-level) when a write targets a closed/retrospected sprint.
**Text:**

> routing-guard: skipped — sprint <sprint-id> status=<closed|retrospected> is exempt from enforcement.

**Notes:** Exit 0. Not surfaced unless `WARPOS_DEBUG=1`.

## C-9 — `sprint-routing-guard` policy missing (fail-open) (linked story `S-10`)

**Context:** stderr (debug-level) when `paths.sprintRouting` is missing.
**Text:**

> routing-guard: skipped — policy file missing at <policy-path>. Delete-to-disable affordance honored.

**Notes:** Exit 0. Not surfaced unless `WARPOS_DEBUG=1`.

## C-10 — release.js coverage refusal (linked story `S-8`)

**Context:** stderr when `/sprint:release` runs `routing.js coverage` and required phases are missing.
**Text:**

> /sprint:release: refused — sprint <sprint-id> missing required routing traces: <phase-list>.
> fix: record the missing traces or downgrade `sprint-routing.json#enforcement.mode` to "warn" if rollout is incomplete.

**Notes:** Exit non-zero. Operator can override by running with `--allow-routing-gap` which logs to decision-ledger and proceeds.
