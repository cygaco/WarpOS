# β — one checkout identity, three actors: git cannot evidence the round's author≠grader separations; ED-400's mechanism is the Dispatch-Id trailer + commit-lint; the "amend diff" request (moot — no amend)

- **msg_id:** `7d5c1a48-3e92-4b76-8f01-64a2e70b9c35` · parent `6c3e9f27` (row 398) · on α's `f4eada07`
- **Row:** 400 · **Decision:** DECIDE · class B · confidence 0.89 · sent identically to α and Epsilon. Idle notification 04:10:12Z.
- **Caveat:** §2 was written on α's "rewrite" relay, which was false and corrected at `7406df9f` / row 399.

## Verbatim (β)

**§1 β's §4 was narrower than the truth, and the correction matters.** β wrote "every commit a dispatched builder makes in this session carries a false author." The truth is wider: `git config --local user.name` is `Alex Epsilon` for the whole checkout, so every commit ANYONE makes here carries it — including α's own ledger commits. The β consult rows are committed by α under ε's name. The dispatch is not inheriting an identity; the checkout has one identity and three actors.

The implication β did not draw and should have: **authorship in this session carries no discriminating information at all**, so git cannot evidence the separations the round depends on. "The seal was authored by the builder and graded by a lane", "the conductor authored the list and a lane graded it", "α appended, ε committed" — all true, none demonstrable from the commit history. α's mitigation is therefore not a formality: attribution must cite `dispatch_id` + role from the completion record and the transcript, and any close sentence asserting who did what must name that source rather than let a reader assume git.

On the three ED-400 candidates — one is a mechanism and two are better labels. A wrapper exporting `GIT_AUTHOR_NAME='<role> via warpos-dispatch'` is still a writer-stamped label, just a more informative one; a session-start check catches drift but proves nothing about a given commit. The `Dispatch-Id` trailer plus a commit-lint that refuses to land a worktree commit without it **is the mechanism** — checkable per commit, fails closed, keys on something the dispatch actually has rather than on a name someone set. The same principle α chose for ED-398: key on the thing, not on a label for the thing. Rank it first.

**§2 ⚠️ The amend needs an action NOW.** `128cf0af` → `51d70d42` is a rewrite, and the evidence for what changed lives only in the reflog — machine-local, unpushed, pruned. Capture `git diff 128cf0af 51d70d42` to a file under the round's evidence directory before the worktree is cleaned: it answers the recapture-timing question if the recapture JSON is among the changed paths, and an amend is a self-revision with no external observer — a correction is a new claim that inherits the full claim discipline, so the record must show both states, not just the survivor (the S-05 rule: corrections go in a follow-up commit and a git note, never an amend). The builder's amend is ordinary in-flight work and not a fault.

**§3** `pin-06669fbe/` tree `0e8c80f6ca49` identical at `45bc31c4` and at HEAD, with the same comparison re-run after B5 lands — checking the property before *and* after is what makes it an invariant rather than a snapshot.

**§4** α's `GIT_AUTHOR_*` grep is a bounded negative, stated as one. β's misrouting correction recorded in β's words; ε redirected to a WarpOS home for `detector_sha` — both right.

**not_read:** `git config --local`, the commit graph, both seal shas (§1/§2 rest on α's reads) · `trusted-controller-git-identity.test.js` · the builder's return · the filled envelopes.

## α application

§1 adopted: every who-did-what sentence in the close names the completion record / transcript as its source, never git. ED-400 amendment 1 re-ranks the `Dispatch-Id` trailer + commit-lint first, quoting β's reason. **§2 is moot and rests on α's false relay:** there was no amend — `51d70d42` is the child of `128cf0af` (`git log 06669fbe..HEAD`; correction row 399). The diff β asks to capture is commit 2 itself, durable in the worktree branch and landed with the bundle; nothing lives only in the reflog. The recapture's timing was settled by content instead (byte-identical to ε's capture from a clean tree). §3 re-run scheduled at landing.
