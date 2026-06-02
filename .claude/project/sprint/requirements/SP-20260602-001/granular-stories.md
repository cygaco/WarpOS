<!-- requirement-format-legacy -->
# Granular Stories — Sealed-capsule executable consumer-contract gate (keystone)

**Sprint:** `SP-20260602-001`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — seal(version): copy the exact bytes the capsule framework-manifest enumerates into a sealed payload dir + verify against checksums.json; refuse on stale/missing manifest (fail-closed).

**As** the user
**I want** seal(version): copy the exact bytes the capsule framework-manifest enumerates into a sealed payload dir + verify against checksums.json; refuse on stale/missing manifest (fail-closed).
**So that** Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — isolate(): create out-of-tree temp repo, git init, install only the sealed payload, assert canonical is unreachable (no abs canonical path in installed files; WARPOS scrubbed env).

**As** the user
**I want** isolate(): create out-of-tree temp repo, git init, install only the sealed payload, assert canonical is unreachable (no abs canonical path in installed files; WARPOS scrubbed env).
**So that** Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — lifecycle(role, path): run setup -> scan:install -> a minimal real sprint -> emit dispatch telemetry -> update; capture exit codes + telemetry window.

**As** the user
**I want** lifecycle(role, path): run setup -> scan:install -> a minimal real sprint -> emit dispatch telemetry -> update; capture exit codes + telemetry window.
**So that** Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — verifyTyped(window, roles): call verifyGauntlet/typed-success against canonical-anchored telemetry; fail-closed on runner-error/malformed/no-record.

**As** the user
**I want** verifyTyped(window, roles): call verifyGauntlet/typed-success against canonical-anchored telemetry; fail-closed on runner-error/malformed/no-record.
**So that** Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — matrix: run lifecycle for role in {canonical,consumer} x path in {cold,warm} via repo-role override threading.

**As** the user
**I want** matrix: run lifecycle for role in {canonical,consumer} x path in {cold,warm} via repo-role override threading.
**So that** Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — wire: register as release/promotion gate (release-gates.js or checks/) + add named enforcer + log enforcement-debt closure if any policy remains unenforced.

**As** the user
**I want** wire: register as release/promotion gate (release-gates.js or checks/) + add named enforcer + log enforcement-debt closure if any policy remains unenforced.
**So that** Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — regen BOTH manifests; add the gate to the testsuite/enforce.js runnable set.

**As** the user
**I want** regen BOTH manifests; add the gate to the testsuite/enforce.js runnable set.
**So that** Releases can no longer ship code that secretly reaches back into canonical-only state (the #1 recurring 'downstream always missing' disease, e.g. the 100 dangling seeded_from pointers). A failing gate blocks promotion before a broken release reaches a real product install.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

