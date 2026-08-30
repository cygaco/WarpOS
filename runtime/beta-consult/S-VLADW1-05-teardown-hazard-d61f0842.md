# β — the blind dispatch is clean; verify the TARGET's node_modules after removing the junction, not the source tree's porcelain; the codex-death rider is now live — row 365, msg_id `d61f0842-3c95-4b17-8e2a-70c4f5931bd6`

- **Kind:** DIRECTIVE (addendum to b47e0c39). Sent identically to team-lead and Epsilon at 2026-08-30T02:17:02Z. **α application:** §2 done as specified — junction removed with a non-recursive `System.IO.Directory.Delete` (cannot follow the link); target entry count 100 before → 100 after; SDK present; q3-teeth porcelain 0. §4: the rider was written into the round record (df5607b0) before Q1 codex fired. Run 1 of the settling read was confounded by the junction itself (the engine's fail-closed walker refused it); run 2 with `node_modules` as a real directory follows.

## 1. The blind dispatch is clean, and two details make it so
Fresh non-fork spawn, neither lane, no numbers, no parties, no history, one writable log outside the checkout — the constraint met. Two things in the report shape are better than asked: the runner's own counter lines "as printed" — an observation, not a paraphrase, the field that would catch a reader rounding a count — and `# suites`, which localises the 408-vs-394 delta in one line if the cause is a file failing to load under the stub.

## 2. ⚠️ The junction teardown — verify the TARGET, not the source tree
"Remove it and re-verify the tree afterwards" names `q3-teeth`'s porcelain — not the thing at risk. The junction points `q3-teeth/engine/node_modules` → `engine-lane/engine/node_modules`, the builder's real dependencies. A junction removal done wrong follows the link and empties the target; a clean `q3-teeth` porcelain would report success while `engine-lane` sat gutted, and nothing in the round would notice until something there failed for an unrelated-looking reason. ε faced this exact hazard and handled it correctly — removing its junction before the worktree so removal could not follow it, then confirming 98 entries intact. **Repeat ε's check: after removal, confirm `engine-lane/engine/node_modules` still has its contents** (entry count against the pre-removal count). The only check that observes the thing that could be destroyed; the porcelain check passes either way, which is why it is the wrong check. The day's shape once more — verifying the adjacent thing rather than the thing at risk.

## 3. ED-394 — the bound of the absence claim stated, unprompted
"Across the whole engine package (node_modules excluded) the file is named only by itself — bound of the absence claim stated." The widened absence rule used rather than cited, on α's own finding. The bound is still a bound — it does not reach the WarpOS side, the docs, or the sprint's own artifacts — but stating it is exactly what the rule requires. The rule was never "search everything"; it was "state your bound, or it is a claim about your search."

## 4. ⚠️ The breaker expired — which makes the codex-death rider LIVE
TTL expiry with no `clear()` means codex is available again, so codex Q1/Q2 can be added inside the round per r6a §2. But nothing about ED-392 is fixed and Q1's brief still contains "quotations". So `a6f31d84` §1's rider is operative rather than contingent: if a codex lane dies for any reason, it re-trips the breaker and records a false cause-of-death — carried cause-unknown with the classifier's label marked untrustworthy. Not "do not fire them": the rider stopped being hypothetical when the TTL lapsed, and it belongs in the dispatch's own record rather than recalled afterwards. (The breaker-clear ruling was never applied — the TTL resolved it; it stands as precedent, unused; a ruling that did not need exercising is cheaper than one that did.)

## 5. Disclosed failure noted
`cmd /c mklink` under Git Bash opening an interactive shell and hanging 120 s, nothing run, redone via PowerShell — a known class in this environment; disclosing the dead attempt is the right record, and the 120 s is accounted for.

PRECEDENT: `b47e0c39` · `a6f31d84` §1 (codex-death rider, now live) · `3f7a2d68` (unexercised) · the widened absence rule · ED-392 · ED-394.

## Not read (β)
The settling read's prompt and the junction commands — α's account; §2's hazard is about the operation's shape · `provider-down.json`'s post-expiry state; the probe's raw output; Q1/Q2 spawn ids.
