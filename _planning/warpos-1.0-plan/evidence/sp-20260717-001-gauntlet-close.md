# SP-20260717-001 runtime-retention — gauntlet CLOSE adjudication (ε)

**Status: ADJUDICATED CLOSED (α ruling under operator "proceed until finished"; β discriminator; Option A).** Build surface `sprint/SP-20260717-001-builder` @ `d498dc75` (+ the doc-correction commit below). Original RED findings: `sp-20260717-001-gauntlet-findings.md`.

## Verdict

Five re-gauntlet rounds. **All MISTAKE-REACHABLE defect classes are closed and confirmed.** Every remaining finding is an attacker-only, out-of-model residual, formally dispositioned. **No open code-defect finding remains.**

Family framing (honest): **2-family GREEN (GPT×2 verdict lanes + Claude in-process passes; agy DOWN per ED-060, 3-lab not satisfiable).**

## Round-by-round (verdicts + closure)

| Round | HEAD | backend | qa | security (GPT) | security (Claude) | Result |
|---|---|---|---|---|---|---|
| 1 | 00040620→bf26cec3 | FAIL | FAIL | reap | PASS | RED — real defects |
| 2 | 042f04aa | FAIL | FAIL | reap | PASS | RED — index-propagation, F-RET-2 cwd, F-RET-1 test |
| 3 | 8a58ff2e | FAIL | FAIL | FAIL | PASS | RED — dest/restore/EXDEV containment class |
| 4 | f78fa186 | reap | FAIL | FAIL | PASS | RED — Win O_NOFOLLOW + hard-link index |
| 5 | d498dc75 | FAIL | FAIL | PASS | PASS | RED — raced-hard-link (dispositioned) + doc bug |

The gauntlet did its job: every round the cross-provider lanes ground a real defect at the worktree, never a vibe. Containment held rounds 4–5 (the systematic `containResolved` pass); each subsequent RED was a strictly narrower, attacker-only residual.

## Closed by construction (mistake-reachable classes — the CRITs/HIGHs)

- **F-RET-1** TOCTOU raw-delete → move-to-archive; CRIT closed, realpath→rename residual MED-LOW tracked (ADR-0017).
- **F-RET-2** untrusted deletion root → `isTrustedRoot` + explicit-root CLI (no cwd default).
- **F-RET-3/4/5/6** regex allowlist / protected-set / self-cap / redacted audit — all closed + tested.
- **F-ROT-1** ≥2 generations (unique archive names); **F-ROT-2** sound pre-gate floor; **F-ROT-3** at/over-cap; **F-ROT-4** seam-absolute (move-site allowlist, no caller escape).
- **F-ENF-1/2/3** enforcer wired + fully fail-closed + inventory-validated; **F-BETA-1** all fan-out sinks registered.
- **EXDEV external-delete** — ELIMINATED (rename-only; archive.js has zero source unlink; grep-asserted).
- **Junction containment** at source/dest/restore + **restore no-clobber** (`COPYFILE_EXCL`) + **atomic O_NOFOLLOW read** (POSIX) — closed + tested.
- D-1 archive-not-delete; addendum B index + restore drill; addendum C manifest-ignore.

## Dispositioned residuals (attacker-only, out-of-model per the standing discriminator)

The operator dropped the adversarial-helm containment threat model; the gate is mistake/overclaim quality control. The standing discriminator (β, delegated): a finding whose only precondition is in-process code-exec / module-mutation OR an attacker-planted filesystem primitive + a won race, with a non-destructive-to-us outcome → out-of-model. Applied:

- **F-ROT-4 SINK_CAPS-mutable** (β DECIDE 0.90) — in-process module mutation = arbitrary JS exec; outcome contained. ADR-0017 / ED-211.
- **Windows O_NOFOLLOW symlink-swap read** — attacker-planted symlink + won race; non-destructive content read; no new capability vs writing a regular handoff-live file. Claim corrected (POSIX-only + best-effort inode recheck). ADR-0017 / ED-210 (record-route gap) context.
- **Raced post-`fstat` hard-linked index write** (α ruling; β discriminator: zero-new-capability dispositive) — the `fstat`→`writeSync` window; attacker-only won race; appends only index TELEMETRY to a same-uid file the attacker can already write. nlink guard DOES close the PRE-EXISTING hard link. ADR-0017 / ED-212. Permanent close (O_EXCL unique per-entry index) available if the threat model expands; not warranted now.

Cross-family value (honest): the GPT lanes caught real containment-boundary gaps + the add-nlink race direction the Claude lane missed (it analyzed the safe drop-nlink direction). The dispositions are **scope-based, not a denial of the technical reality** of the findings.

## Overclaim corrections (this close commit)

- ADR-0017 Decision paragraph: removed the stale "EXDEV → copy-then-unlink" (the fallback is removed; rename-only).
- ADR-0017: the "never writes outside root" guarantee scoped honestly to non-malicious operation + pre-existing hard links, with the raced-link residual enumerated.

## Liveness

gauntlet-verify with `--completionsFile <worktree ledger>` (the ED-016 ledger-split fix, root-caused not papered): round 5 — all 3 codex lanes `ok:true`, well-formed records, in-window → liveness PASS. Claude in-process lane = verdict-with-evidence-file (`out-security-claude-r5.txt`), ED-210 registry-type record gap noted.

## Commit chain

`bf26cec3` (initial) → `c27e9190`+`042f04aa` (R2) → `64cefee8`+`8a58ff2e` (R3) → `f78fa186` (β F-ROT-4 fold) → `9a2c1984`+`d498dc75` (R5 attempt-4) → this doc-correction commit.

Ready for the β boundary verify + merge to main.
