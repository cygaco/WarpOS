# Data Contracts

When a founder edits a field anywhere in the app, that edit must reach every feature that uses it. This doc defines how that works and how to verify it.

## The problem

A field is editable in the UI. The founder changes it. But downstream — when a launch plan gets generated, a research run runs, or a prompt goes to Claude — the old value is used, or the new value is never read at all, because nobody wired it up.

This has two failure modes:

1. **No pipe** — the consuming feature never reads the field from the session. The wire was never built. The edit is dead on arrival.
2. **Stale pipe** — the consuming feature read the field once (e.g., on page load) and cached it. The founder edits it later, but the cached copy is what gets used.

## Rules

1. **Every consumer must have a wire.** If a field is editable and its data contract table says "consumed by X", then X's code must explicitly read that field from the session and include it in its payload/output. If the wire doesn't exist, it's a bug — not a future task. An editable field with no downstream consumer is dead UI.

2. **Always read at call time.** When building a feature that consumes founder data, read the current session value when the API call or prompt is assembled. Never snapshot fields into component state that could go stale between edits and usage.

3. **Document the wire.** If a prompt payload includes any of these fields, the prompt template's contract must list which session fields it reads. This makes missing wires auditable.

4. **Wire ownership belongs to the consumer.** The builder of a consuming feature (e.g., plan generation) is responsible for reading the fields it needs from the session. The builder of the producing screen (e.g., Constraints) is only responsible for saving the field to the session correctly.

5. **Post-build wire check.** After all builders complete, the evaluator must verify every wire listed in every contract table across the app. For each row: grep the consumer's code for an explicit read of the session field. If the read doesn't exist, flag it as a bug. No wire = broken feature, not a future task.

## Where contract tables live

Each feature spec that produces editable fields includes a "Downstream data contracts" section with a table mapping fields to consumers. These are the current locations:

- [onboarding/INPUTS.md](../05-features/onboarding/INPUTS.md) — all onboarding screens (Brief, Goal, Channels, Budget, Geography, Quick Check, Dealbreakers, Profile Review)
- [auth/INPUTS.md](../05-features/auth/INPUTS.md) — sign up, sign in, OAuth
- [landscape-research/INPUTS.md](../05-features/landscape-research/INPUTS.md) — query editor, analysis, segment locking
- [deep-dive-qa/INPUTS.md](../05-features/deep-dive-qa/INPUTS.md) — deep-dive Q&A answers
- [scope-curation/INPUTS.md](../05-features/scope-curation/INPUTS.md) — scope include/exclude, priorities, custom exclusions
- [plan-generation/INPUTS.md](../05-features/plan-generation/INPUTS.md) — segment selection, inline editing, download
- [channels/INPUTS.md](../05-features/channels/INPUTS.md) — headline selection, follow-up answer editing, export
- [credits-economy/INPUTS.md](../05-features/credits-economy/INPUTS.md) — pack selection, purchase flow
- [launch-run/INPUTS.md](../05-features/launch-run/INPUTS.md) — plan selection, run mode, Runner setup, launch rules
- [profile/INPUTS.md](../05-features/profile/INPUTS.md) — post-onboarding profile editing

**Features with no founder inputs (no INPUTS.md needed):**
- `readiness` — pure calculation/display, no founder input
- `shell` — navigation and layout only
- `dev-console` — dev tools (not founder-facing)
- `launch-console` — covered by launch-run INPUTS.md

All contract tables follow the same format:

| Field(s) | Consumed by |
|---|---|
| Field name | Feature that reads this field and what it does with it |

## How to verify (evaluator checklist)

For each row in every contract table:

1. Identify the session field name (e.g., `session.constraints.channels`)
2. Identify the consumer (e.g., "research run queries — research provider `channel` param")
3. Grep the consumer's code for an explicit read of that session field
4. If found: wire exists, pass
5. If not found: flag as bug — "Field X is edited on [screen] but never read by [consumer]"

This check runs after all builders complete, before the build is considered done.
