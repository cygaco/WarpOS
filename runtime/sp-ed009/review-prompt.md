# Cross-provider review — ED-009 shared repo-role resolver adoption (session/2026-06-15)

You are a backend code reviewer. Give a BINDING verdict on a small, load-bearing refactor. Be skeptical and adversarial — this touches a SAFETY FLOOR (the admin:* "never run/seed against WarpOS itself" guard), flips an ENFORCER to blocking, and modifies the single canonical-vs-consumer role resolver every guard reads. Same-family green is NOT sufficient here; find the false-greens.

scopeContract: { "mode": "read-only", "allowedFiles": [], "forbiddenFiles": ["**/*"], "note": "read-only reviewer — write findings ONLY to runtime/sp-ed009/xreview.md" }

## What changed (read the actual files + the diff)
- Diff: `runtime/sp-ed009/diff.patch` (7 files, ~511 lines).
- Core: `scripts/warpos/repo-role.js` — extracted the canonical filesystem-signal tiers into a DRY `detectCanonicalSignal(root)` and added an env-IMMUNE `isCanonicalDir(dir)` (signals-only: ignores the `override` arg AND the `WARPOS_REPO_ROLE` env). `resolveRepoRole()` behavior is intended to be UNCHANGED (precedence: override > env > signals > consumer-heuristic > unknown).
- Adoption: `scripts/admin/preview.js` + `scripts/admin/seed.js` — `refuseIfTargetIsWarpOS` now delegates detection to `isCanonicalDir` + keeps the `resolved === WARPOS_ROOT` path-belt, instead of re-deriving canonical signals inline (the ED-009 violation).
- Enforcer wiring: `.claude/commands/scan/full.md` — `scripts/checks/repo-role-single-source.js` wired BLOCKING.
- Tests: `scripts/warpos/test-repo-role.js` (+8 isCanonicalDir cases incl. env-immunity both directions) and `tests/regression/SP-20260614-002/preview-failclear.test.js` (the safety-floor behavior change).
- Spec: `.claude/project/sprint/requirements/SP-20260614-002/acceptance-criteria.md` AC-R1c repointed.

## The reconciliation you MUST scrutinize
A PRIOR cross-provider review of the admin suite (HIGH #5) demanded seed.js/preview.js NOT use `resolveRepoRole`, because that resolver gives `WARPOS_REPO_ROLE` env PRECEDENCE over filesystem signals — so a hostile/misconfigured env could spoof the canonical tree into looking non-canonical and DEFEAT the safety floor. This change re-routes detection THROUGH the resolver module, but via the NEW `isCanonicalDir`, which is signals-only and env-immune.
- VERIFY: `isCanonicalDir` truly ignores `WARPOS_REPO_ROLE` and the override arg. Is there ANY path by which env/override leaks into the admin guards' decision? (Repro: `WARPOS_REPO_ROLE=consumer node -e "console.log(require('./scripts/warpos/repo-role').isCanonicalDir(process.cwd()))"` MUST print true on this canonical repo.)

## The safety-floor behavior change you MUST scrutinize
The OLD admin guard refused on MERE PRESENCE of a top-level `warpos:` block in the target manifest. Evidence (`scripts/warpos/scaffold-core.js:542`) shows EVERY scaffolded consumer product carries `warpos:{version,installed:true,source:<provenance>,features}` (source NOT "self") — so bare-presence refusal would refuse the very products admin:preview targets (latent over-refusal bug; live run deferred = ED-053). The fix STOPS refusing on bare presence; it refuses only on real canonical signals (`_warpos/MANIFEST.json`, `.warpos-canonical`, `warpos.source==="self"`, `warpos.repoRole∈{canonical,framework}`, `project.slug==="warpos"`, `version.json#name`).
- VERIFY there is NO false-NEGATIVE against the REAL WarpOS canonical repo (it must still be refused — it carries `_warpos/MANIFEST.json` + `warpos.source==="self"` + `slug==="warpos"`, AND the `resolved===WARPOS_ROOT` path-belt).
- HUNT for a realistic directory where dropping bare-presence lets a guard run/seed against a true canonical tree. (β named one: a mid-build canonical tree that has shed ALL signals — backstopped by the path-belt only when the target IS this very repo. Is that backstop sufficient? Is there a worse case?)
- Is the new test (`preview-failclear.test.js`) asserting the CORRECTED behavior honestly (consumer block NOT refused; `source:"self"` IS refused), or does it merely paper over the change?

## Enforcer soundness
`repo-role-single-source.js` is now BLOCKING. Could a guard still re-derive role in a shape its grep patterns MISS (false-negative in the enforcer itself)? Is the allowlist (resolver + its test + `scripts/warpos/manifest/` content-readers) too broad?

## Output
Write full findings to `runtime/sp-ed009/xreview.md`. End stdout with ONE line exactly:
`VERDICT=<PASS|FAIL> BLOCKERS=<n> NOTES=<n>`
