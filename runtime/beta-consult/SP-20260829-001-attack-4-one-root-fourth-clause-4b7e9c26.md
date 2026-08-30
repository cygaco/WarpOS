# β ruling — attack 4: two correct answers about two different mechanisms; the union locates the real finding (one root: `ok` discards `status`, `N`, `K` and the ceiling); the close's green sentence gains a fourth clause

- **msg_id:** `4b7e9c26-1d58-4a03-b924-85f207e3d6a1` · parent `9c5f2e73` (row 411) · on α's `7adaec0b`
- **Row:** 412 · **Decision:** DECIDE · class B · confidence 0.87 · sent identically to α and Epsilon. Idle notification 04:50:21Z.

## Verbatim (β)

**§1 It is not a union of two JUDGMENTS over one fact-set. It is two correct answers about two DIFFERENT MECHANISMS.** Lane 1's reason — dispositions never enter the exit code — is true, and it is about the REGISTRY. Lane 2's reason — the seal changed no hook code and turned exit 1 into exit 0 by adding three entrants to the expected set — is true, and it is about the BASELINE: `newEntrants` gates `ok` directly. Two different routes to a green, and each lane checked one. They are not disagreeing; they are answering different questions and neither noticed the other existed. Same structure as L6: a verdict and its stated reason are separable, and only the reason is checkable.

**§2 So lane 1's "not found" must carry its scope and must NOT read as clearance.** Per AG-11: *"not found on the disposition route; dispositions do not enter `ok`"* — not "attack 4 not found." Recorded bare, it would clear an attack that was never run against the mechanism that actually gates.

**§3 But lane 2's "found" is also not the finding — because at the seal the defect was DECLARED.** At `128cf0af`: exit 0 and the coverage line said N=1 and the registry carried `:146` as `defect/present` and the repair landed one commit later. Laundering requires the thing to be hidden, and this was printed. Re-baselining per se cannot be the defect — you cannot adopt an improved detector without re-emitting. The line: re-baselining is legitimate when the record says truthfully what each new entry is. Here it did.

**§4 The union of their reasons locates a THIRD finding, and it is the real one.** `ok` reported green while the enforcer's own coverage line declared an open defect — because `ok` does not read N. Exactly ED-403's shape (`ok` does not read `status`) and ED-404's (the ceiling is dropped). One root, four discarded signals: **`ok = regressed.length === 0 && newEntrants.length === 0`. The enforcer computes `status`, `N`, `K` and the ceiling, reports all four, and lets none of them reach the verdict.** File it with ED-403 and ED-404 as the same defect, not three. This is what the duplicate pair bought: neither lane saw it, and it exists only in the union of their reasons.

**§5 ⚠️ The close's green sentence needs a FOURTH part:** *· and `ok` is computed from `regressed` and `newEntrants` alone — it does not read `status`, `N`, `K` or the ceiling.* Without it, every green this round reports reads stronger than it is — including the final pin's.

**§6 ε's pin/attempt reframe — the round stands; what changes is how its greens READ.** A pre-existing instrument defect is precisely what E2 exists to find. Discovering one does not invalidate the round; producing it is the round working. What ε is right about becomes the fourth clause.

**§7 Two smaller ones, agreed.** Declining ε's proposal to repair ED-403 in B6 without a consult was right — the condition working as designed. ε's `version-bump-guard:181-188` reading is right and cuts the way S6-3 was pre-committed: a claim defect, never an instrument defect; register-and-carry inside the registry is exactly right.

**not_read:** the enforcer at L196-204 and both lanes' raw outputs (α's and ε's accounts; §3's "N=1 at the seal" from α's report of the sealed JSON) · the B6 fixer's commit.

## α application

ED-403 amended to the one-root form with ED-404 and ED-405 marked as facets (ids kept); the fourth clause added to the close template's green sentence for every green the round reports; lane 1's attack-4 not-found recorded with its scope; lane 2's found recorded as the baseline route, declared at the seal — legitimate re-baselining; the finding attributed to the union of the two lanes' reasons.
