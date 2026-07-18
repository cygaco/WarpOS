# ADR 0019 — Event compactor archives the WHOLE file and reseeds a bounded tail, instead of archiving a slice and rewriting the hot log

**Date:** 2026-07-18
**Status:** accepted (β DECIDE, class B, 0.89, OPEN_ADR:true, logged to the β events ledger; SP-20260718-002 design→build boundary)
**Class:** B (architecture + a security/data-durability property: never-lose-raw, kernel CORE-4 runtime side)
**OPEN_ADR:** true

---

## Decision

The event compactor (`scripts/events/events-compact.js`, SP-20260718-002 / D-1) folds old events by **archiving the WHOLE live events log** (via `scripts/hooks/lib/archive.js#archive` — one atomic whole-file `renameSync` into the in-root, indexed archive tier) and then **reseeding a bounded raw TAIL** back onto the freshly-recreated live log as an append-only write, preceded by an additive `compaction-summary` pointer record. It does **NOT** archive a prefix slice and then temp-write+`renameSync` a `[summary + tail]` replacement over the live `events.jsonl`.

The write-ahead seam order is fixed: **archive-durably + index FIRST (S5), reseed the tail append-only ONLY after (S9).** The only destructive operation on raw event data is the S5 whole-file rename, and it lives entirely **inside** `archive.js`. `logger.js` (the hot append path) is **not modified** and does not cooperate with the archive lock.

## Context

C1's requirement is a bounded live log that keeps a hot TAIL while older raw moves to the archive — strictly more than `rotate.js` (which moves the WHOLE over-cap file and lets the next append recreate it). The PRD's implementation sketch (S-2/S-4) proposed archiving a computed prefix *slice* and then rewriting the hot log in place to `[summary + tail]`. The director-of-engineering consult refined this at the build_spec tier (precedence 70 over the design-sketch 30) to the whole-file-archive → reseed-tail model. Two concrete defects made the slice model unacceptable for a HIGH-risk, never-lose-raw sprint:

1. **Lost-append race.** `logger.js` appends to `events.jsonl` **without** taking `archive.tryLock`. A temp-write+`renameSync` that replaces the whole inode discards any append that lands between the compactor's final re-read and its rename. Re-reading under the lock does not close the window, because the appender never takes the lock — there is always a reread→rename gap in which a raw event is silently dropped. Silent raw loss is exactly the irreversible outcome CORE-4 forbids.
2. **AC-4 (no-unlink) violation.** The sketch's hot-log `renameSync` on raw is precisely the forbidden op. The whole-file model puts the sole `renameSync` on the live log **inside** `archive.js`, so the "compactor moves raw only via archive.js" invariant holds **by construction**, not by discipline.

The whole-file model inherits `rotate.js`'s proven safety property: a single atomic whole-file rename captures everything up to the rename instant — a concurrent append either rode into the archived generation or lands on the recreated file; **never split, never lost**. The compactor's only *new* operation over rotation is the append-only tail reseed, which cannot lose an append (append never truncates). Making `logger.js` cooperate with the lock (the alternative that would rescue the slice model) was **rejected** as hot-path risk expansion and is unnecessary under the whole-file model.

## Crash-recovery convergence semantics (β rider #1)

After a crash at **post-S5, pre-S9** the archived generation is durable + indexed but the live log is empty. Because the compactor's fold gate returns no-op when `live < FOLD_TRIGGER`, the next pass does **not** auto-reseed the old tail — and that is correct: never-lose-raw holds (all raw is in the archived generation, recoverable via `query --archive`); the live log simply repopulates from new appends. **Resolution (b) adopted:** the compactor adds **no** crash-recovery reseed branch (zero new code, zero new failure mode); the qa-plan's post-S5 convergence assertion is corrected to "CONSERVES-via-archive; live repopulates from new appends (NOT auto-reseeded)". Resolution (a) — an explicit archived-but-live-empty recovery branch — was rejected because it must distinguish post-crash-empty from fresh-install-empty, adding a stateful decision that could itself be buggy, against this sprint's simplicity-for-safety priority. The conservation/convergence check stays; only the earlier assertion text was wrong. A builder must not delete the check to satisfy a stale assertion.

## Consequences

- **Never-lose-raw (CORE-4) holds by construction**, not by careful ordering discipline in the compactor: the one destructive rename is `archive.js`'s, which keeps the source on any rename failure (ADR-0017) and never unlinks.
- **`logger.js` stays untouched** — no hot-path lock cooperation, no new hot-path failure mode.
- **Accepted cost:** each fold archives the whole file (tail included), so archived generations overlap and prior summaries accumulate in the tier. This is R-1-SAFE over-preservation; the `query --archive` union reader dedupes by event `id` and suppresses a redundant `compaction-summary` when its raw is present. Storage growth is what the archive tier is for.
- **win32 note:** a concurrent `appendFileSync` holding the handle at the rename instant can make S5 `renameSync` throw EPERM; `archive.js` catches it → the compactor no-ops that pass and retries next pass (source intact). Reseed ordering may be cosmetically imperfect after a recreate; the union reader sorts by ts/id, so ordering is not trusted from file position.
- **The reason this ruling exists is to prevent a regression:** a future refactor that "simplifies" the compactor back to a slice+in-place-rewrite reintroduces the lost-append race and breaks AC-4. This ADR is the durable home for that rationale so the simplification is recognized as a regression, not a cleanup.
- **Enforcer:** AC-4's grep/AST test over `events-compact.js` (forbid `fs.unlink|rmSync|truncate|renameSync|writeFileSync` on the events file; allow only `appendFileSync` + `archive.archive`) fails loudly if a slice-rewrite re-enters the compactor; AC-1 conservation (with the mandatory dropped-id negative control) + AC-3 crash-seam matrix (via the required `compactOnce({crashAfter})` hook) assert never-lose-raw at every seam. Builds on ADR-0017's contain-via-archive doctrine — the whole-file model is that doctrine made structural for compaction.
