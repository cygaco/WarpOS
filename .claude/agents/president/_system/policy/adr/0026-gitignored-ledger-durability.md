# ADR 0026 — Enforcement-debt ledger durability (the split-durability class)

**Date:** 2026-07-18
**Status:** proposed — **OPEN_ADR: true** (ε drafts options + a recommendation; α ratifies the resolution DIRECTION)
**Class:** B (enforcement hygiene; affects the on-main self-host + fresh-checkout conformance)
**Sprint:** SP-20260718-004 (Phase 2 — identity + host portability) · ED-221
**Relies on:** the Phase-0 top-level-runtime-contract.md `Deferred: ED-NNN` trailer discipline + `contract-lint.js`

---

## Context — the confirmed split-durability defect

The enforcement-debt ledger lives at `.claude/project/memory/enforcement-debt.jsonl`. It is **GITIGNORED** and
**NOT tracked** in the index (verified: `git check-ignore` matches; `git ls-files` returns nothing). Meanwhile:

- Committed, TRACKED documents CITE EDs — e.g. `top-level-runtime-contract.md`'s `Deferred: ED-214/215/216/
  217/218` trailers, and the `Enforcer:`/`Deferred:` policy discipline across the codebase.
- `contract-lint.js` (G0.1) REQUIRES that every cited `ED-NNN` **exists in the ledger** (its own doc: "any
  `ED-NNN` cited anywhere in the document that is absent from the ledger" fails).

So the REFERENCE (the citation) rides the merge (it is in a tracked file); the TARGET (the ED record) does NOT
(the ledger is gitignored). On a **fresh clone / on-main self-host / a downstream install**, the ledger is
absent, so `contract-lint.js`'s cited-ED check false-REDs against citations that are perfectly valid on the
authoring machine. This is the **split-durability class** (the same shape the SP-20260718-001 Phase-0 self-host
hit; `feedback_gitignored_ledger_doesnt_ride_merge`): a committed contract cites EDs whose durable home does not
travel with the repo.

This is NOT a hypothetical: it is why the release-close reconciliation for this epic has to "append the new EDs,
dedup-by-id" by hand and re-run the self-host on the merged state — a manual step that exists ONLY because the
durable target is untracked.

## Options considered

1. **Track the whole ledger (un-gitignore `enforcement-debt.jsonl`).** Simplest to state. COST: it is an
   append-only, high-churn log written by many sessions/tools → constant merge conflicts and diff noise on a file
   nobody edits by hand. Rejected as the primary shape (it makes a working log a source of merge friction).

2. **(RECOMMENDED) Split reference from working state: a TRACKED `cited-ED registry` + the gitignored working
   ledger.** Introduce a small, tracked, human-curated `enforcement-debt.registry.jsonl` (or a `cited-eds.json`)
   that holds EXACTLY the EDs that are CITED by committed artifacts (the durable subset). `contract-lint.js`
   resolves a cited ED against the UNION of {tracked registry, gitignored working ledger}; a cited ED absent from
   BOTH fails. The working ledger stays gitignored (no churn); the durable subset rides the merge. A `/scan:full`
   check keeps the two in sync: any ED cited by a tracked file that is missing from the tracked registry is a
   lint FAIL (self-detecting drift). This localizes durability to the SMALL cited subset, not the whole log.

3. **Generate a tracked snapshot at commit/release time** (a manifest of cited EDs materialized from the working
   ledger, committed alongside). COST: another regen step + a staleness window; equivalent guarantee to Option 2
   but with a generator to maintain. A fallback if curation in Option 2 proves noisy.

4. **Make `contract-lint`'s cited-ED check fail-OPEN when the ledger is absent.** Rejected: it silently disables
   the exact integrity check (a cited-but-nonexistent ED would pass on every fresh checkout) — a false-green.

## Recommendation (ε — α ratifies)

**Option 2.** It makes the DURABLE subset (cited EDs) travel with the repo while keeping the high-churn working
log gitignored — reference and target both durable for exactly the EDs a tracked document depends on, with a
self-detecting sync check so the two cannot drift. Option 3 is the fallback if hand-curation is too noisy.

**Named residual (honest scope):** whichever option lands, the gitignored WORKING ledger remains the write path;
this ADR makes the CITED subset durable, not the whole history. Builder/fixer EDs authored inside a worktree
(the `.claude/project/memory/` gitignored path) still live only on-disk until reconciled — the release-close
append-and-dedup step is reduced, not eliminated, until the producer writes cited EDs to the tracked registry.

## Enforcer

Pending α's direction. If Option 2: `contract-lint.js` (union resolution + a new tracked-registry-drift check
wired into `/scan:full`, exit non-zero when a tracked file cites an ED absent from the tracked registry). The
enforcer is named here so the policy does not ship without one (every-policy-needs-a-named-enforcer). Debt:
ED-221 stays OPEN until the ratified option lands with its enforcer.
