# CORRECTIONS — against `runtime/enforcement-sweep/2026-08-29/b5/ENVELOPE.md`

B6 (SP-20260829-001). The envelope's own bytes are untouched — this file annotates it,
it does not edit it. One entry per false sentence found IN THE ENVELOPE (as opposed to
in the registry or the baseline, which carry their own in-place corrections with
superseded text kept — see `scripts/checks/gate-failclosed-registry.json` and
`scripts/checks/gate-failclosed-baseline.json`). Findings are recorded as a **union**
where both review lanes reached the same conclusion by different routes — never as
"both reviewers confirmed", since lane 1 (`d-mtfb42md-46a6f456`, in-process
backend-reviewer, claude-opus-5, 57694-byte prompt) and lane 2 (`d-mtfb502r-59c5678e`,
cabinet/gpt-5.6-sol, cross-family, a distinct 21041-byte lean prompt) read different
bytes and answered different questions; agreement between them is evidence, not
replication.

---

## Entry 1 — the sealed coverage figures embedded in the envelope

**Sentence as it appears** (envelope §"Enforcer's full JSON on the sealed tree", verbatim
quoted JSON, `coverage.phrasing`): *"1 of the 79 sites the detector at 06669fbe
enumerated are under enforcement, 75 untriaged (3 further baseline site(s) are triaged
non-enforced [not-a-defect/not-a-gate]; 0 registry defect row(s) have no live-detector
counterpart at this sha...)."*

**Why false:** this is the actual, verbatim output the enforcer printed at commit
`128cf0af` — not a paraphrase — so it is not "corrected" here (correcting a verbatim
historical run output would falsify the record of what that run printed). What is false
is treating it as still-current: it was computed over a registry whose
`edit-watcher.js:674` row wrongly stated `tool_correlated:false` (see registry item 1's
in-place correction). Recomputed with only that one field fixed, the honest partition at
that same commit would have been `triaged_not_enforced=4`, `K=74`, not `3`/`75`.

**Found by:** lane 1 (F-1, certain — re-ran `computeCoverage()` with the field corrected
and got `triaged_not_enforced=4, K=74`) **and** lane 2 (F-3, certain — same conclusion,
independently re-derived from the emitted baseline+registry) — **union**: both lanes
independently recomputed the same partition and landed on the same corrected numbers,
by different derivations.

**Correction:** superseded by this bundle's own re-measurement after fixing the
correlation field (see the bundle record / `ENVELOPE.md` for B6's own run): do not carry
the `3`/`75` pair, or the `1`/`79` pair, forward from this envelope into any later close.

---

## Entry 2 — the disposition table's `ownership-guard.js:144` row

**Sentence as it appears** (envelope §"Every disposition assigned (emitted table,
S6-2)", table row): *"ownership-guard.js:144 | **NEW ROW** → not-a-defect (triaged as:
defect, then repaired by B5-R same worktree) | absent | false | ..."*

**Why false:** the envelope itself states, in the same document, "B5-R... **not part of
the seal**." The seal is commit `128cf0af`. In the registry as it stood at the seal, this
row's actual fields are `disposition: "defect"`, `expected_finding: "present"`,
`tool_correlated: true`, `tool_finding_line: 146` (verified directly:
`git show 128cf0af:scripts/checks/gate-failclosed-registry.json`). Every column the
table gives is true only of the un-sealed, HELD commit (`51d70d42`/`6f3a0685`). This
contradicts the sealed enforcer JSON printed later in the SAME envelope, whose `N: 1` is
produced by exactly this row still carrying `defect`/`present` at the seal — with the
table's stated dispositions, `N` would read `0` at the seal, which is not what the
sealed JSON shows.

**Found by:** lane 1 (F-3, certain). Lane 2's F-2 and F-8 name the same underlying gap
(the seal ships one open, undeclared-in-the-table defect) from the baseline/pointer
angle rather than the table angle — related, not a duplicate finding of this specific
table row; recorded here as lane 1's finding, with lane 2's adjacent findings recorded
separately in Entries 3 and 4 below.

**Correction:** the table row is not amended (the envelope is not edited); the fact that
the row's fields shown in the table are the HELD/post-repair state, not the sealed
state, is recorded here. Readers of the table should treat every column for this one row
as "after `6f3a0685`", not "at the seal `128cf0af`."

---

## Entry 3 — the B5-R "same demonstrated standard" claim

**Sentence as it appears** (envelope, §"What I could not check", third bullet):
*"Whether `ownership-guard.js:144`'s repair (B5-R) is the right phase for this work —
that is exactly why it's HELD and not squashed into the seal; **I did not decide this
for the ruling, only prepared the repair to the same demonstrated standard as B3's.**"*

**Why false:** B3's nine repairs each carry a dedicated, executed entry in
`runtime/enforcer-fixtures/SP-20260829-001/b3-fault-injection.test.js` — a committed
test that injects the named fault through the real hook harness and asserts the
allow/block outcome. `git show --name-status 51d70d42` touches 3 manifests, 4 runtime
artifacts, the baseline, the registry and `scripts/hooks/ownership-guard.js` — no test.
`b3-fault-injection.test.js` is untouched by either `51d70d42` or `6f3a0685`. The
repair's only demonstration is `siteStillPermissive()`, a 12-line regex window testing
for the absence of the string `process.exit(0)` — absence-of-a-token, not execution of
the handler.

**Found by:** lane 1 (F-4, certain). Lane 1 additionally executed the missing injection
itself and reported it in the review record (`printf 'not json' | node
scripts/hooks/ownership-guard.js` → stderr `BLOCKED: ownership-guard could not evaluate
this edit`, exit 2) — confirming the repair IS correct, only the "same standard" claim
about its evidence is not.

**Correction (per this bundle's brief, attributed to the reviewer, no new test added —
adding one now would make the old claim true and erase the gap this sprint exists to
find):** the repair was verified by (a) `siteStillPermissive()`'s bounded-window check
(`{checked:true, permissive:false}`, as the envelope already states) and (b) one
fault-injection run **executed by reviewer `d-mtfb42md-46a6f456`** during B5's review
(the `printf 'not json' | ...` run above), not by a committed fault-injection test. This
differs from B3's nine sibling repairs, each of which carries its own entry in
`b3-fault-injection.test.js`. See also `scripts/checks/gate-failclosed-registry.json`'s
`ownership-guard.js:144` row, which is edited in place to record the same correction.

---

## Entry 4 — the "8 of them" verification count

**Sentence as it appears** (envelope, line after the disposition table): *"Every
'not-a-defect/absent' row above (**8 of them**: dependency-admission-guard:33,
gate-check:57+190, ownership-guard:66+144, secret-guard:94, worktree-preflight:160, and
B5-R's own ownership-guard:144 confirmed twice) was verified by executing
`siteStillPermissive()`..."*

**Why false:** the table directly above holds **seven** rows with
`expected_finding: absent` at the seal+repair state the sentence is describing. The list
names seven distinct site ids and then re-names `ownership-guard.js:144` a second time
as "confirmed twice" to reach 8 — so "8" counts verification EVENTS, while "rows above"
counts ROWS. At the bare seal (`128cf0af`, before `6f3a0685`) there are only **six**
absent rows (`ownership-guard.js:144` is `defect`/`present` at that commit, not yet in
the absent set).

**Found by:** lane 1 (F-5, low, certain) **and** lane 2 (F-7, medium, certain) —
**union**: both lanes independently counted the table's rows and got seven, against the
envelope's stated eight, from different angles (lane 1 via the enumerated site list;
lane 2 via counting `expected_finding:absent` rows directly plus separately noting the
seal/HELD state substitution already covered in Entry 2).

**Correction:** the honest form is *"every one of the seven `expected_finding: absent`
rows was verified by execution; `ownership-guard.js:144` was checked twice — once at
`128cf0af` where the check does not apply (it was still `present`), once at `6f3a0685`
after its repair, where it returned `{checked:true, permissive:false}`."* The set
carries its own unit; the bare number "8" did not.

---

## Entry 5 — `worktree-preflight.js:160`'s decision-semantics quote

Not an envelope sentence — this is a **registry** correction (the quote lives in
`gate-failclosed-registry.json`, not in `ENVELOPE.md`). Recorded here only as a
cross-reference: lane 2 raised it as its F-4 (the row's mechanism account is false
because `git()` at L25-32 swallows every `execSync` failure), and β's ruling
(`8d4a1f65`, `9c5f2e73`) established that the quoted sentence is `worktree-preflight.js`'s
OWN comment, authored by an earlier bundle, quoted faithfully by B5 — so it is annotated
in place in the registry (three-part note beside the quote), not rewritten, and not
listed as a numbered envelope correction here. See the registry's
`worktree-preflight.js:160` row.

---

## Entry 6 — `version-bump-guard.js`'s three-site claim

Also not an envelope sentence — the claim lives in the registry's
`decision_semantics_quote` (itself `version-bump-guard.js`'s own comment, quoted
faithfully) shared by rows `:108`, `:171`, `:198`. Lane 2 raised it as its F-5 (a fourth
site, the `capsuleDir` `statSync` catch at L181-188, silently produces a fail-open
outside `failClosed()`). Annotated in place in the registry per this bundle's item 7, not
rewritten here, and a new `contested` row (`version-bump-guard.js:183`) added for the
missed site. See the registry.

---

## Not corrected here (recorded, not repaired)

- **Entry 1's underlying cause** (the `edit-watcher.js:674` correlation field) is fixed
  at its source in the registry (item 1), not in this file — this file only notes that
  the envelope's downstream JSON dump predates that fix and must not be read as current.
- **The pointer to this envelope from `gate-failclosed-registry.json`'s
  `ownership-guard.js:144` row** (lane 1's F-8, lane 2's F-8 — **union**, both lanes
  independently found the pointer resolved to an uncommitted file at both `128cf0af` and
  `51d70d42`) is handled as item 9 in the registry itself: the pointer now resolves
  because commit `0591c473` committed this envelope to the branch — stated there as
  **resolved by the landing**, not as repaired.
