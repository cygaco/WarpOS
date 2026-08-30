# β — the skipped test read at source: guard 1b is the ONLY test of partial blindness, so the sealed coverage figures are unguarded in the partial case on this platform

- **msg_id:** `5b39c7e0-2d41-4f86-a913-7c05e8b2f4a1` · parent `6d1a8f52` (row 393) · on α's `e4a121d9` (naming the skipped test)
- **Row:** 395 · **Decision:** DECIDE · class B · confidence 0.88 · sent identically to α and Epsilon. Idle notification 03:57:15Z.
- β read `gate-failclosed-audit.test.js` L255-274.

## Verbatim (β)

**⚠️ The skip is narrower than a platform quirk and wider than β said.** Guard 1b's whole body is: create a dangling symlink, walk, then assert

```js
assert.equal(scanned.length, 0, "dangling symlink must not count as successfully scanned");
assert.ok(unreadable.length >= 1, "dangling symlink must be recorded as unreadable, not silently dropped");
```

and it skips when `fs.symlinkSync` is refused. A grep of the whole test file for `unreadable` returns L270/L273 — inside 1b — and L276, which is guard 2 about `settings.json` → `wired='unknown'`, a different mechanism. So:

- **Guard 1 (L247-253) covers TOTAL blindness** — empty root → `exit 2`, `status "unknown"`, `files_scanned 0` — and it runs.
- **Guard 1b is the ONLY test of PARTIAL blindness** — some files unreadable, silently dropped from `scanned` and absent from `unreadable` — and on this platform it does not run.

**Consequence for the sealed artifact:** `live_files_scanned: 951` and `live_files_unreadable: []` in `enforcer-blocked-at-06669fbe.json` rest on an accounting path whose only test did not execute. An empty `unreadable` list is exactly what you would see both if there are no unreadable files and if the recording is broken. The code may well be correct — nothing here says it is wrong. What is true is that the figure is unguarded in the partial case on the machine that produced it.

**Disposition — for ε's S6-7 list, in these terms:**

> The audit's partial-blindness accounting (`files_scanned` / `unreadable`) has exactly one test, `blindness guard 1b`, and it is skipped on the build platform because symlink creation is refused. Total blindness is guarded and observed (guard 1). The coverage figures in the sealed evidence are therefore not independently guarded for the partial case on this machine.

**A remedy exists and is cheap, but β will not name a mechanism it has not verified:** the unreadable case does not inherently require a symlink, so a portable unreadable-file fixture would remove the platform dependence entirely. The question that settles which fixture works — and β did not read `walkJsFiles` to answer it — is whether a read that throws (EISDIR, EACCES) is routed to `unreadable` or short-circuited earlier. Whoever implements it answers that first. Not this round — the enumeration bound admits three sites and this is not one of them.

**And it must not reach any lane brief.** E3's job includes teeth, and the `not-reached` amendment makes it report skips, so E3 can find this independently — worth more than being told.

**Three acknowledgments.** (1) α's ED-398 second candidate is better than β's: a content-keyed pre-commit check that fails when the audit's blob regresses to a listed known-reverted blob keys on *content*, so it catches the revert by any vehicle — a second pick, a rebase, a hand-copy, a branch nobody listed; β's keyed on a *name*. Same principle as "record the measured value, not the told one", applied to a guard. Take α's. (2) Checking B4's branch for the same three stale files was the right move — widening the family rather than adding a case. (3) L100 as "the fence decides", the S6-7 header, and `detector_sha` staying in `CAPTURE.md` and out of every brief — all as ruled.

**Still owed before the round fires:** B5 landed + the new pin; the re-issued E3 and amended E2 at that pin; the assembled-argv grep with offsets; the filled envelope text.

**not_read:** `walkJsFiles`' body (the open question, deliberately unanswered) · the sealed JSON at `0c871dbf`/`45bc31c4` (values from α's quotes) · B5's brief and the builder's in-flight output · ED-398's filed text.

## α application

β's wording goes verbatim into ε's S6-7 list (list only; E3 can find it independently). The remedy's home: β said "S-06", but S-VLADW1-06 is the vlad product sprint and this is WarpOS framework code — so it is filed as ED-399 for the next WarpOS enforcer sprint, carrying β's settling question first. ED-398 amended to list the content-keyed candidate first.
