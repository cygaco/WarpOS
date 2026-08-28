# S-VLADW1-03 — RETRO INPUT (ε)

Closed at honest state 2026-08-28, NOT released. S2 failed the qualifying gauntlet; rule applied verbatim.

## Dispatch: three death signatures, now separable

- **Foreground clamp** — `ok:false`, `elapsed_ms` **540xxx**, 0 stdout, **real work UNCOMMITTED on disk**. Hit 10a and 10b. Cause: `dispatch-claude.js` fail-closed clamps to the 540 s foreground ceiling unless `WARPOS_DISPATCH_BACKGROUND=1`. Recovery: resume-and-finish with the env var, NOT a rebuild. ED-353.
- **Nothing spawned** — **no ledger row at all**, no process, no artifact, nothing anywhere. The operator's `!` run of a Git-Bash env-prefix command in PowerShell died in the shell before the wrapper ran. Discriminator: the clamp leaves work on disk; this leaves nothing.
- **Bound timeout AFTER commit** — `ok:false`, `elapsed_ms` **1200177**, 0 stdout, **work COMMITTED, tree clean**. 10c committed `977ab14` at 19:12:56Z and the 20-min bound fired at 19:13:18Z: **22 seconds.** The timeout cost the ENVELOPE, not the work.
- Lesson: **the ledger row alone cannot classify a dispatch death.** `elapsed_ms` plus the worktree state does. Artifact-first is not a nicety here; three times this sprint the record said dead and the tree said otherwise.

## The enforcer that fired and went unread

- `err-10c.log` carried, at fire time: *"WARN (ED-257 right-sizing): build-chain prompt for 'backend-fixer' is 16810B (> 12000B floor) — implies a >15-min unit."* It was exactly right. My Part-B fold-ins took 10c from ~9 KB to 16810 B and pushed it past the bound.
- **The enforcer already existed and worked. I did not read stderr at dispatch time.** That is worth more than a new enforcer. 10f was deliberately sized at 6044 B and finished in 235 s.
- Candidate: surface the right-sizing WARN where the dispatcher actually looks, or refuse over-floor build-chain briefs unless explicitly overridden.

## Liveness and recovery

- **ε died mid-gauntlet at a usage limit**, between writing the backend lane's evidence file and writing its completion record. Recovery was artifact-first: the evidence file WAS the lane's real Agent return, so the record was written from it and **no lane was re-run**. Re-running would have burned ~10 min and produced a second, different review.
- Also: I said "polling in-turn" and then yielded to idle. The lead caught it. **An idle teammate does not poll** — if the wait is real, hand it to the lead or stay in-turn.

## Claim discipline, turned on myself

- I reported the tree "clean / `git status --porcelain` empty" when I had run the **path-scoped** `-- engine/` form. The **backend lane refused to assert a clean tree on my wording** and flagged the 41 untracked `.claude/` entries it actually observed. A reviewer catching the conductor's imprecision is the system working.
- I characterised the CRLF finding as a falsifier that "silently becomes a no-op" and as "the fixture-that-cannot-fail shape". Both wrong: 10b had shipped an `assert.notEqual` guard, so it failed LOUDLY. Corrected before α ruled against the wrong framing. **A conductor's summary reaches α faster than the evidence does; overstatement is expensive.**

## Cross-family review: agy is 3 for 3

- Three gauntlets, three defects the cross-family lane found that all Claude lanes missed. This round: absorption iterates the current call's list while deletion sweeps history. **The backend lane circled the same code, tried to construct the losing case, and explicitly could not** — agy named it from two files with no tools.
- Two lanes converging on one region from opposite directions, one unable to construct it and the other naming it, is stronger than either alone. **A finding all Claude lanes miss is not thereby cleared.**
- Also learned: the agy argv ceiling is **32000 assembled**, not the 32768 I had recorded, and it **BLOCKS rather than truncating** (RIDER-1: "NEVER a partial-review pass"). `WARPOS_AGY_PRINT_TIMEOUT` needs a unit (`300s`, not `300`).

## The finding that matters most for the successor

- **The bind now pins two falsehoods.** Fix attempt 2's byte-for-byte binding pinned verbatim two sentences the security lane falsified by execution, so `check:ship` REQUIRES a proven-false sentence to be present. An honest correction turns the gate red until the bind moves in the same change.
- **And the bind's own predicate skips rather than refuses** — only an exact em-dash matches, so en-dash / hyphen / colon / indented Ceiling paragraphs ship green while the shipped sentence promises EVERY bolded Ceiling lead-in is bound.
- Pattern across three gauntlets, now unmistakable: **every repair produces a new defect one layer out from the thing it fixed.** The generalisable rule: after building a control, attack the control itself, not only the thing it protects.

## Shell escaping cost me four attempts on one command

- Building a Windows path in bash, `"${B}\\${L}"` renders as a literal `\${L}` — the backslash escapes the `$`. It bit me three times in a row (junction creation, robocopy target) before I separated the backslash into its own variable. **β then found the wreckage:** a directory literally named `iso${L}` holding a full 5555-file `node_modules`, which I had created and not noticed. Untracked, never committed, now removed.
- Same family: `cmd /c mklink /J` needs `MSYS_NO_PATHCONV=1` or MSYS rewrites `/J` into a path.
- Lesson: when a shell command fails twice on quoting, **stop and check what it actually created** rather than adjusting the quoting a third time. The failed attempts left an artifact I did not look for.
- **There is no script to repair** — the isolation harness was an ad-hoc command, never committed (checked: no tracked `.js`/`.sh`/`.md` carries the pattern; the `scripts/dispatch/gui.js` hits are JS template literals, a different thing). So the durable fix is the working form, recorded here for S-04 rather than re-derived: build the separator as its own variable — `BS='\'` then `TGT="${B}${BS}${L}${BS}engine"` — because `"${B}\\${L}"` escapes the `$`. And prefix `MSYS_NO_PATHCONV=1` for any `cmd /c mklink /J`.
- **Do not junction `node_modules` for lane isolation.** `no-held-secret-in-surface` correctly refuses to walk a non-regular dirent (*"dirent is neither a directory nor a regular file — refusing to silently skip it"*). Use a real copy (robocopy `/E /MT:16`, ~5555 files) or serialize the lanes. Serializing is what this round did, and it cost ~25 min of wall time and zero fidelity risk.

## Process

- **Duplicate ED filing:** α filed the clamp gap as ED-353 at 16:12Z; I filed the same gap as ED-355 at 16:45Z. α's framing is the transferable lesson — *"a condition that names no owner gets done twice."* Assign an owner at the moment a gap is observed, or two people will write it up.
- **What I would keep:** every lane brief named the specific failure that had happened to THAT lane before (three lanes were lost to truncated mid-thought returns across gauntlets 1-2) and told it to cut scope rather than run out of room before emitting JSON. **All three Claude lanes returned their JSON on the first dispatch this round.**
