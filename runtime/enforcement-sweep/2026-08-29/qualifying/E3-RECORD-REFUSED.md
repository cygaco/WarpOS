# E3 has NO completion record, and the refusal is correct

`record-inprocess` REFUSED to write a row for E3, verbatim:

```
record-inprocess is for in-process routes only (CLAUDE_AGENT / AGENT_TOOL);
role 'test-runner' resolves to route 'claude-raw', a CLI/subprocess role — dispatch it
via 'node scripts/dispatch-agent.js test-runner <prompt-file>' (or spawnAgent), which
capture real subprocess output.
```

## Why this happened — my dispatch error

I spawned E3 as an **in-process Agent** under `subagent_type: test-runner`. The role
registry classifies `test-runner` as a **subprocess** role (`claude-raw`). So the lane ran
in-process under a role whose declared route is not in-process, and the runtime correctly
refuses to mint an in-process completion record for it.

**The refusal is the fail-closed behaviour this sprint exists to produce**, fired against the
conductor, by the conductor's own runtime, on the conductor's own dispatch. It is not a
defect to work around.

## What I did NOT do

I did not re-run `record-inprocess` under a different `--role` to make it succeed. Passing
`qa-reviewer` would have produced a row whose `role` and `model` fields describe a lane that
did not run — ED-393's exact subject, manufactured by the party the disclosure exists to bind.
**There is no completion record for E3 and I will not create one.**

## What exists instead, all measured

- Raw return preserved verbatim: `out-E3.raw.md`, from the harness transcript
  `tasks/a34e63055bcb9f731.output` (329519 B, 111 rows), final assistant text 9310 B.
- **Verdict token `{"verdict":"fail"}`**, read from that file.
- Harness agentId `a34e63055bcb9f731`. **No dispatch_id exists.**
- Original spawn `2026-08-30T06:02:33.770Z`; **20-turn ceiling**; resumed `06:05:20.174Z`;
  final message `06:08:39.367Z`. Wall-clock spawn→final **365597 ms**, across two legs.
- Prompt bytes, from the transcript rather than from memory:
  - leg 1: 1863 B, sha256 `b2d0d0be1278e58d1100b0088389f67a64c8c29cc78fc1cad78606dbf76606a9`
  - leg 2 (resume): 2352 B, sha256 `02a410bdc1acf47780fc9082ee34b78b3830a63ff790e211fa4c4d4a206f5efb`
- **Containment: measured FALSE.** `assembled-E3.md` is 10693 B; the largest prompt leg is
  2352 B. A 10693-byte file cannot be contained in a 2352-byte string. By-reference confirmed
  by arithmetic, not by recollection.
- Checkout verified by me, not accepted from the lane: `git status --porcelain
  --untracked-files=all` → **0 lines**; HEAD `c88aac1df718fc0772c16b6e428130a095549a6c`.

## E2's prompt is unrecoverable

`tasks/a6b0e660114e407fa.output` exists and is **0 bytes**. E2's prompt string was passed
inline and never persisted, and its transcript is empty, so **no sha of E2's prompt can be
produced by anyone**. That is a second confirming instance for ED-407 in the same round:
for E2 the record says `prompt_bytes: 0` and the transcript is empty, so the only evidence
linking E2 to its brief is the lane quoting the brief's content markers back.
