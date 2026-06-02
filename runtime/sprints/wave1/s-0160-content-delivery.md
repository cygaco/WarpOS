# Sprint spec — #4 0.16.0 Content-Delivery Integrity (RE-SCOPED to Option D)

- **Worktree:** `C:/Users/Vlad/Desktop/Claude/Projects/warpos-wt-0160-content-delivery` (branch `warp/s-0160-content-delivery`, at current main; RESET clean — discard the prior off-scope 99-stub WIP)
- **Risk:** medium → full 4-reviewer gauntlet + telemetry verify.
- **Close:** engine sprint → ff-merge to main, defer retro, HALT before push.
- **Set `--completions=<worktree>`** on dispatch to dodge the ED-016 relative-path telemetry gap (until typed-success fixes it permanently).

## RE-SCOPE rationale (Beta DECIDE, 2026-06-01)
The build surfaced that ALL 100 `seeded_from` pointers in `_warpos/MANIFEST.json` DANGLE — the seed
templates (`framework/templates/_requirements/**`) were never authored. That resolution belongs to the
**deferred 0.16.0 Pattern-realignment sprint** (build `_warpos/templates/` with REAL seed content =
option A), NOT this hardening slice. Do NOT auto-stub hollow templates (rejected). Do NOT delete the
seeded_from pointers (they are the correct architectural intent / spec — Beta DECIDE b=A-not-C). So:

## Acceptance criteria (Option D — what THIS sprint ships)
1. **AC1 — ship-coverage hardening, as a REAL gate with a tracked allowlist.** Extend
   `scripts/checks/warpos-ship-coverage.js`:
   - Add the `seeded_from`-resolves assertion (every manifest `seeded_from` must point at a real file).
   - The **100 currently-dangling** pointers go into a documented **`KNOWN_DANGLING` allowlist** (mirror
     the existing `KNOWN_NOT_SHIPPED` pattern at `warpos-ship-coverage.js:111`), each tied to the
     Pattern-realignment sprint with a one-line reason. The gate **exits 0** with the known-100
     allowlisted, but **REDS on any NEW dangling pointer** outside the allowlist (honest enforcer — not
     false-green, not false-red).
   - Also curate the ~218 (builder verified 232) `owner=framework` dev-tooling paths into the reviewed
     `KNOWN_NOT_SHIPPED` allowlist so ship-coverage is exhaustive (zero unallowlisted owner=framework).
2. **AC3 — install-matrix update parity.** Add a post-update assertion to
   `scripts/warpos/test-install-matrix.js`'s `existing_install_upgrade` scenario that every
   structure-parity `REQUIRED_DIR` exists after update (reuse the existing `warpos-structure-parity`
   runner + `CLAUDE_PROJECT_DIR`, don't duplicate the dir list). Clean + independent.

## DEFERRED to the Pattern-realignment sprint (NOT this sprint)
- **AC2 — seed-with-provenance** (extend `populate-source.js`): blocked — there is no seed source
  content to copy until the 99 templates are authored. Moves to Pattern-realignment.
- **Author the 99 real seed templates** (option A) + **clear the `KNOWN_DANGLING` allowlist** once they
  resolve. This is the Pattern-realignment sprint's job (build `_warpos/templates/` + `_warpos/BASELINE/`).
  Tracked via the allowlist entries (each names the deferral) — Policy & Enforcement Hygiene satisfied.

## Definition of done (this sprint)
AC1 gate ships real: `seeded_from`-resolves enforced, 100 known dangles allowlisted (tied to
Pattern-realignment), ~232 owner=framework curated into KNOWN_NOT_SHIPPED, exits 0, REDS on any new
dangle. AC3 install-matrix parity assertion added + matrix green. Tests for both. Regen both manifests.
Full gauntlet. HALT before push.
