# WarpOS 1.2.0 — 2026-07-29

> **About this file.** The tree at tag `warpos@1.2.0` carries the *generated placeholder* version of these
> notes; this is the authoritative text, landed after the tag. The wording below was written and reviewed on
> time and was simply not copied into this file before tagging — disclosed here rather than backfilled
> silently. The tag is not the distribution surface: `scripts/warpos/update.js` reads
> `<source>/framework/releases/<version>/release.json` from whatever ref the source checkout sits on, normally
> `main`, so an installing user gets this text. A reader deliberately parked at the tag sees the placeholder —
> and also finds this correction, the tracked review verdicts under `runtime/beta-consult/`, and the gap
> recorded as tracked debt.

## `/memory:verify` ships with its executor held

The `--apply` mutation path of `/memory:verify` is **held fail-closed in 1.2.0**. Running it refuses before it
touches the filesystem. There is no override — no environment variable, flag, or config key re-enables it.

**Why.** After five review rounds the executor still cannot guarantee the two claims a caller most needs to
trust:

- On a **successful delete** it silently alters bytes it was not asked to touch — the line endings of every
  retained line of your `MEMORY.md` are rewritten, so a store authored with CRLF is normalised without consent
  or report.
- On a **failure** it does not guarantee your store is unchanged, while reporting that it is. A failed run can
  leave the store already modified, and a rollback can report success over a store that still holds residual
  change.

Four findings remain open against it — two more alongside the two above, both in the same family: a rollback
that verifies only the paths it tracked rather than the store itself, and a discarded cleanup error that leaves
a working file behind under a clean-rollback report, which then blocks every subsequent run. All four are
recorded, with their ids, in `trackers/sprints/SP-20260725-002-memory-verify.md`.

**This is a deliberate governance hold, not a bug.** The executor is withheld rather than broken — and it is
withheld precisely because the guarantees above are the ones it exists to make.

**What you still get.** The read-only detector — `scripts/checks/memory-integrity.js` — **ships and is useful
on its own.** It finds the structural drift that actually accumulates in a memory store: index lines pointing
at missing files, memory files with no index line, duplicate entries and name slugs, invalid frontmatter, and
malformed index lines that would otherwise be silently dropped. **It never writes.** Run `/memory:verify`
without `--apply` and you get the full report plus the exact plan a future `--apply` would execute.

Because the executor is held, eight behaviours that were previously tested end-to-end are now tested only as
far as the refusal, and two consequences of the apply path are asserted nowhere while the hold stands. That is
a real reduction in coverage, not a bookkeeping change, and it is part of why the hold is not treated as a fix.

**When it comes back — and the branch where it does not.** The hold lifts when the executor's guarantees are
written down as invariants and the code is verified against those written invariants, rather than against
another round of individual findings, which is what produced five rounds. **It may also not come back in this
sprint at all:** if that verification surfaces another high-severity finding in the byte-fidelity or
transaction-honesty families, `--apply` does not ship in this sprint and becomes a scoped follow-up instead.
Both outcomes were committed to in advance, and neither is decided yet.

## Release-gate integrity

Two release gates could not execute on hosts with a large accumulated working tree: their clean-state snapshot
read the full untracked-file listing through a buffer the listing had outgrown, so the child process was killed
and the gate reported a **failure** rather than reporting that it **could not run**. Both call sites now bound
that read generously and name the underlying error if it recurs. One consequence is worth stating plainly: the
fix did not make those gates pass — it let one of them report its honest *incomplete* state instead of an
opaque error. The bound was raised, not removed, so the class stays open as tracked debt.

## Also in this release

- The finding-class boundaries used by the review process (byte-fidelity and transaction-honesty) and the
  no-relabelling rule now have a tracked, shipped home as an ADR, so the scope of a review cap resolves from
  any clone rather than from a working file.
- `/memory:verify`'s skill doc marks the held path at every location a reader actually hits, and correctly
  describes the frontmatter-memory directories as home-anchored with no paths-registry key.

## Breaking changes

None.

## Schema changes

None. `version.json`, the framework manifest, the paths registry and the hooks registry all keep their
existing schema versions.

## Migrations

None.

## Pinned commit

The commit this capsule was built from is recorded in **`checksums.json#commit`**:
`11fead50d68c6eef21664ecd49d2dcd538a0e9c7`.

Note that `release.json#commit` is `null` in this release — and in 1.1.0. The skeleton writes that field null
and nothing populates it, while the build records the real value in `checksums.json` instead. This section
previously pointed readers at the null field. The mismatch is recorded as tracked debt; use
`checksums.json#commit`.
