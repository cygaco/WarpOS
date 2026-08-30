# E1 re-fire — STAGED, not fired

## Probe: `codex exec resume` does not exist (codex-cli 0.146.0)

`resume` is a TOP-LEVEL subcommand, not a subcommand of `exec`. From `codex resume --help`:

```
Resume a previous interactive session (picker by default; use --last to continue the most recent)
Usage: codex resume [OPTIONS] [SESSION_ID] [PROMPT]
  --include-non-interactive   Include non-interactive sessions in the resume picker and --last selection
```

E1 ran under `codex exec` — non-interactive — so it is selectable only by UUID or via
`--include-non-interactive`, **and `resume` resumes into an interactive session.** No documented
headless form exists, so a resumed E1 would open a TUI rather than run to completion and exit.
**Option (a) is not viable.**

## The dispatch contract forbids reading `codex exec`'s own help

`codex exec --help` is refused by `dispatch-route-guard`: *"Direct cross-provider CLI prompt
invocation is forbidden. Pattern matched: codex exec …"*. So an undocumented resume flag on
`exec` cannot be ruled out. The guard prints a sanctioned `WARPOS_PROVIDER_PROBE=1` one-shot for
provider-health probes; **it was not used** — self-granting an escape hatch to answer my own
question is the shape refused elsewhere in this round. Authorisation is the orchestrator's.

## The fresh-fire contingency, as posed, closes E1's fourth class

Staged checkout: `.claude/worktrees/enf-e1-claimtruth`, detached at `c88aac1d`, `porcelain 0`,
content-verified (SUPERSEDED prefix present; 16 registry rows; 2 `contested`).

Measured inside it:

```
runtime/enforcement-sweep/2026-08-29/S6-7-RESIDUALS.md          EXISTS
.claude/project/memory/enforcement-debt.jsonl                   DOES NOT EXIST
```

The ED ledger is **gitignored**, so it is absent from every worktree. E1's fourth class is
*the enforcement-debt rows this sprint authored*. **Standing E1 in a static checkout makes
class 4 `not-reached` by construction** — the exact reachability the codex probe
`d-mtfdqch0-ba3db823` was fired to establish.

**Third consequence of the ED-408 class in this round:** R-13 muted a stale-marker warning,
R-14 flipped a release gate's exit code, and this would silently bound a lane's population.

**Proposed repair — a proposal, not an act.** The envelope already carries `Your checkout` and
`Enforcement-debt ledger` as separate lines. Point the first at the static worktree and leave the
second at the repository root. E1 is read-only, so one root-path read is safe, and every artifact
E1 grades then sits in a tree that cannot move. Whether a two-path envelope remains *environment*
rather than *method* is the gate's ruling, not the conductor's — and it is a boundary that would
be decided in the conductor's own favour, which is why it is routed.

## Bound, with its derivation

E1 was working three seconds before the kill — 86 tool calls, three sub-agents, mid-synthesis at
`06:09:06Z`, killed at 1500 s. **Proposed `DISPATCH_BUILDER_TIMEOUT_MS=3000000`, 2× the observed
1500 s** — derived from the only measurement available, not nudged. **There is no evidence that
3000 s suffices.** If it dies at the new bound, that is the finding: the task is not completable
within any bound set for it, and S6-1 / S6-2 / S6-3 close as NO_DATA.

## State

Checkout staged and reversible. **`assembled-E1.md` untouched at `bf8dfae73dd38a75`.** Nothing
rebuilt, nothing dispatched.
