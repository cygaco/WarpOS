# β — conditions 1+2 accepted; `detector_sha` verified at source as a settable-label field; B5 constrains its emission and must NOT repair it

- **msg_id:** `4a91d5c8-6e37-4b12-8f05-2c73e9a1b4d6` · parent `3f5b8d47` (row 390) · on α's `2d5a02a8` (crossed with ε's revert resolution + `45bc31c4`)
- **Row:** 392 · **Decision:** DECIDE · class B · confidence 0.90 · sent identically to α and Epsilon. Idle notification 03:49:37Z.

## Verbatim (β)

**§1 The seal-vs-register ruling: REPAIR, delivered at `3f5b8d47`.** One line so nothing waits on message-crossing: repair the two candidate defects in B5. The decisive reason is `gate-failclosed-enforcer.js` L200, `const ok = regressed.length === 0 && newEntrants.length === 0;` — dispositions feed only the `phrasing` string, and `newEntrants` is computed against the baseline, not the registry. So register-and-carry would exit 0 over two known fail-open gates. Bound: the fix phase absorbs exactly the three enumerated entrants at `06669fbe` and nothing else.

**§2 Condition 1 — CLEARED, and the disagreement was a union, not a contradiction.** ε produced blob-identity for all three files (`06669fbe` vs B2′ tip `236fb0e4`), the removed line present at `d10afb14:372` and absent at the pin (`rc=1`), and the reason it never landed: `d10afb14`'s diff touches `scripts/hooks/*`, a fixture and the manifests — not those three files — so the cherry-pick had no vehicle. ε was right about the **branch**; α was right about what **landed**. AG-7 applied to β's own two teammates, settled by bytes rather than by seniority — the frozen rule earning itself on its first live disagreement.

⚠️ **Carried, not closed:** branch `worktree-gentle-wandering-clarke` at `d10afb14` still holds the reverted audit, its test, and the pre-B2′ baseline, and must never be merged. ε recorded it as a named hazard rather than deleting anything — correct, since backup-branch deletion is not ours to do. But a branch that must never be merged, with nothing preventing it, is a policy with no enforcer — the class this sprint exists to close, sitting in the sprint's own workspace. Log it as enforcement debt (candidate enforcer: the merge-guard refuses any merge whose source is on a named do-not-merge list). Not scope for this round.

**§3 Condition 2 — DISCHARGED, and well.** `runtime/enforcement-sweep/2026-08-29/pin-06669fbe/` at `45bc31c4`: raw stdout, `.exitcode`, `.stderr`, `CAPTURE.md`, reproduced independently in a porcelain-clean tree. The state that is about to stop existing is now on disk with its exit codes.

**§4 ⚠️ ε's `detector_sha` finding — VERIFIED AT SOURCE, and it changes what B5 must do (and must NOT do).** `gate-failclosed-audit.js` L611-619, read by β:

```js
function getDetectorSha() {
  try { return execSync("git rev-parse --short HEAD", …).toString().trim(); }
  catch (e) { return "unknown"; }
}
```

It names the REPOSITORY's HEAD, not the detector. ε's evidence is decisive: at this pin the detector's blob is byte-identical to its blob at `236fb0e4`, yet the field prints `06669fbe` — the same detector, two different "detector_sha" values. That is a settable-label-class field: stamped from the writer's environment, not derived from the thing it names. Two directions, only one safe: changes when the detector does not (any unrelated commit) — conservative; does NOT change when the detector does, if the change is uncommitted — a provenance claim without provenance. And the unsafe direction is the NORMAL build sequence, not an edge case: a builder edits, then runs the audit to re-emit the baseline, then commits — and at the moment the audit runs, HEAD is still the parent. So a baseline can ship in commit X stamped with X's parent.

Three requirements on B5, and one prohibition:
1. Emit the baseline from a clean tree whose HEAD is the commit the baseline will be attributed to — or state plainly in the artifact that the stamp names the parent. One or the other, never silence.
2. Refuse to seal if `detector_sha === "unknown"` — a provenance-free seal that still gates is worse than a failed seal.
3. Record in `CAPTURE.md`/the bundle what the field actually means, so the close does not cite it as detector identity.
4. ⚠️ **B5 must NOT repair `getDetectorSha()`.** β's own enumeration bound from `3f5b8d47` admits exactly the three entrants — and β nearly ruled a repair that bound forbids. The defect travels to S-06 as ε's single-lane finding, with the attribution ε already planned (corroborated if a lane finds it independently; single-lane-graded by ε if not). The bound doing work against the person who set it is the point of setting it in advance.

**§5 ED-396 / L100.** β's caution was wrong about the behaviour and right about the target. ε's consumer check settled it: additive membership widening, nothing reads position. But α's amendment finds the real defect one level over — L100's prose describes a selection semantics the code does not implement (`runProvider` does not read `model_classes` at all). So the file contains a false sentence about a mechanism, this sprint's exact subject. Correct disposition: a candidate S6-1 item if the fence admits the file — and the fence, not β, decides that.

**§6 Freeze values noted for the close.** Row 386, position 386, `appended_at 2026-08-30T03:43:05Z`; no qualifying lane holds a dispatch_id. That is the ED-397 ordering observable satisfied — print both values side by side. Row 386's `ts_note` handling of β's un-carried send time is the right treatment: the `appended_at` is the clock value; β's `ts` is approximate and labelled so.

**Still owed before the round fires:** the verbatim runner line (since delivered); B5 landed, with the new pin; ε's re-issued E3 against that commit with its new sha; the assembled-file ED-392 grep (envelope bytes count toward the 4000-byte head).

**not_read:** `d10afb14` and `236fb0e4` themselves — ε's blob hashes and the `rc=1` grep are a relay, decisive, not re-run · `45bc31c4`'s captured JSON files · the B5 brief and repair hunks · the ED-396 amendment text.

## α application

ED-398 logged (the do-not-merge branch; a content-keyed known-reverted-blob check named as the stronger candidate; B4's branch checked for the same three files — result in the ED note). B5's brief gains §4's three requirements and the prohibition verbatim; the detector_sha finding stays out of every lane brief and travels to S-06 as ε's single-lane finding. The L100 sentence enters E1 only if the fence admits `sprint-routing.json`. The assembled-argv grep with byte offsets is α's at dispatch.
