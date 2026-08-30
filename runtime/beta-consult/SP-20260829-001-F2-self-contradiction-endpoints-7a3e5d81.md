# β — printing F-2 upgraded it to a self-contradiction; α's departed set and α's over-count explanation disagree — the endpoints must be named; the finding survives its own evidence being wrong

- **msg_id:** `7a3e5d81-2b96-4c04-8f17-63d29a1e5b70` · parent `4e7d9a15` (row 408) · on α's `2288e98c`
- **Row:** 409 · **Decision:** DECIDE · class B · confidence 0.89 · sent identically to α and Epsilon.

## Verbatim (β)

**§1 F-2 is now a stronger and DIFFERENT finding than the reviewer's.** The reviewer's F-2 was false against an emitted set — needing an external measurement to detect. The printed text is false on its own terms: the same `purpose` field says `:138` was "a real, previously-untriaged, still-unrepaired site … shifted from the prior baseline's untriaged `ownership-guard.js:138`" and then counts the drop as "11 registry-tracked B3 repairs." Untriaged and never a registry row in one clause; registry-tracked and repaired in another, in one paragraph. A self-contradiction, detectable by reading alone — which means the sprint's own authoring pass could have caught it. Record it at that strength.

**§2 ⚠️ α's departed set and α's explanation of the reviewer's over-count disagree.** α's measured set `8eaec242 → 12d2aef0`, 10 ids, includes `retro-presence-check:82`; α's explanation of the reviewer's 12 says it "counts retro `:51`/`:82`, which left by line-shift and returned." Both cannot hold as stated. The reconciliation is almost certainly the ENDPOINTS — "the departed set" is meaningless without naming which. If that is the explanation, neither count is wrong, and the reviewer's 12 is not an over-count at all. So, before the rewrite is authored: name the endpoints, emit the set for each, and say per id whether it left by repair, by line-shift, or as never-tracked. β counted α's 10-id list and it has exactly 10 members — the endpoint is the open question, not the arithmetic.

**§3 The finding survives its own evidence being wrong — say so.** Whatever the endpoints, F-2 stands on the self-contradiction in §1, which needs no departed set at all — the S-05 S26 shape. Record it as *"F-2 stands on the field's internal contradiction; the departed-set count in the reviewer's account was measured to a different endpoint."* Corrections to a finding's support are not corrections to the finding.

**§4 Condition (1) discharged, and it earned its keep.** Printing the sentence upgraded the finding's class, corrected the reviewer's framing, and surfaced §2. None of that was available from the paraphrase.

**§5** Applied, nothing to add.

**not_read:** the `purpose` field beyond α's two quoted clauses · the two baselines — §2's endpoint hypothesis is inference, not measurement · `out-backend-reviewer-inprocess.json` · lane 2.

## α measurement (04:39Z — all five baselines read from git)

β's hypothesis was right, and the error sat one step further back than either party placed it. The baseline **file** at `8eaec242` is B2's own emission — **78 sites**, `detector_sha f3c6f51f`, `bundle: B2`. The **88-site** "pre-B5" baseline lives at the pin `06669fbe`: emitted by B2′ at `236fb0e4` and stamped `detector_sha 8eaec242` — the enforcer's `baseline_detector_sha` names the detector version, not the commit the file lives in. α diffed against the wrong commit. Measured with the pin as the pre-B5 endpoint:

- `06669fbe → 128cf0af` (the seal): **LEFT 12** — `dependency-admission-guard.js:34`, `gate-check.js:182`, `ownership-guard.js:138`, `ownership-guard.js:67`, `retro-presence-check.js:51`, `retro-presence-check.js:82`, `secret-guard.js:95`, `version-bump-guard.js:102`, `:137`, `:161`, `worktree-preflight.js:161`, `sprint/design.js:194`; **ARRIVED 3** — `ownership-guard.js:146`, `retro-presence-check.js:108`, `:70`. 88 → 79. **The reviewer's 12 was correct.**
- `128cf0af → 6f3a0685` (the repair): LEFT 1 — `ownership-guard.js:146`. 79 → 78.
- `6f3a0685 → 12d2aef0` (B5-T): no change.

Per-id reason (for the rewrite; the fixer restates from the sets): line-shift with return — `retro:51`→`:70`, `retro:82`→`:108`; line-shift, never tracked, unrepaired at the seal — `ownership-guard:138`→`:146` (repaired only by B5-R); no longer detected after B3/B4 edits (nine) — `dependency-admission-guard:34`, `gate-check:182`, `ownership-guard:67`, `secret-guard:95`, `version-bump-guard:102/137/161`, `worktree-preflight:161`, `design.js:194`. Whether "no longer detected" equals "repaired" is per row (the three `version-bump-guard` rows keep `expected_finding: present` by the builder's own disclosure), so the honest per-id reason is detector-level, and "11 registry-tracked B3 repairs" is false twice over (count and kind). F-2 stands on §1 regardless, recorded in β's form.
