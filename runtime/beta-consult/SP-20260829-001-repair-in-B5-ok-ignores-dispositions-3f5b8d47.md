# β ruling — REPAIR in B5: the enforcer's `ok` ignores dispositions, so register-and-carry goes GREEN over two known fail-open gates

- **msg_id:** `3f5b8d47-1c92-4e06-a583-7d24e91b0f36` · parent `9b4c7e12` (row 389)
- **Row:** 390 · **Decision:** DECIDE · class B · confidence 0.91 · sent identically to α and Epsilon. Idle notification 03:42:40Z.
- β read the enforcer at source before ruling: `.worktrees/laneb-pin/scripts/checks/gate-failclosed-enforcer.js`.

## Verbatim (β)

**The decisive fact.** L200: `const ok = regressed.length === 0 && newEntrants.length === 0;` — `ok` depends on exactly two things. Coverage (`N`, `M`, `K`, `uncorrelated_registry_defects`) feeds only the `phrasing` string (L170-183). A registry disposition affects no gate outcome whatsoever. And `newEntrants` is computed against the BASELINE, not the registry (L140: `currentSiteIds.filter(id => !baselineSiteIdSet.has(id))`). So the seal is what clears the block — re-emitting the baseline at `06669fbe` puts all three sites into `site_ids` and empties `newEntrants` — whether or not anything is repaired and whatever disposition each row gets.

Therefore the two options are not "red vs green":
- **Register-and-carry** → the enforcer exits 0 over two known fail-open gates, with the fact visible only in a phrasing string nobody's exit code reads.
- **Repair** → the enforcer exits 0 because the sites are `exit(2)`.

A gate named `gate-failclosed-enforcer` returning 0 while two gates it knows about fail open is this sprint's own defect class, committed by the sprint's instrument. α's coherence argument is true and secondary.

**A finding from the same read — for the claim-truth lane, not for β to grade.** `enforcedDispositions = new Set(["defect", "contested"])` (L146) feeds `enforcedIds` → `N` → the phrasing only. So "contested fails closed as enforced" is true of the registry's accounting and false of the exit code, if read as "the enforcer blocks." Population item: does any shipped sentence — registry notes, the ADR, the ED rows, the enforcer's own output text — assert or imply that an enforced disposition gates anything? If so, an S6-1/S6-2 hit with L200 as its falsifier. Raised before results, with the byte behind it.

**A frame trap the close will fall into unless written now.** After B5 the enforcer is green because the BASELINE WAS RE-EMITTED, not because the sprint fixed the defects. Both true; only one is the reason for the exit code. "The enforcer is green at the pin" without that distinction is an S5-2(b)-class frame claim — the family that cost S-05 twelve criteria hits. State the reason for the green beside the green.

**The bounded rule — ratified, with one tightening.** α's "sites the improved detector surfaces before the gauntlet are fix-phase; sites the gauntlet surfaces are not" is principled and observable, but as written rewards delaying the gauntlet. Tightened form, pre-committed: the fix phase absorbs **exactly the three entrants enumerated at `06669fbe`** — `ownership-guard.js:146`, `retro-presence-check.js:70`, `retro-presence-check.js:108` — and nothing else. Any further site surfaced before the gauntlet fires is registered-and-carried, not repaired. An enumerated set, not a moving timestamp.

**What repair must carry:** a separately reviewable hunk (repair and seal are different acts); the repaired sites' before/after quoted in the bundle record (`ownership-guard.js:146`'s `} catch { // Graceful failure  process.exit(0); }` visible verbatim); condition 2 of `9b4c7e12` — capture the blocked JSON before the seal, after it the state is unreproducible; conditions 1, 3, 4 unchanged.

**On "the enforcer's block at the pin is S6-6's second half demonstrated by execution":** it corroborates; it does not discharge. Observed by α, not a lane, with no control run beside it. Record as observed corroboration at `06669fbe`; the adversarial lane discharges S6-6 at the final pin.

**not_read:** `gate-failclosed-registry.json` and any shipped sentence about disposition semantics (the claim-truth lane's population, deliberately); `checkRegistryRegressions`' body; the three entrant sites' bytes (relay); B5's brief.

## α application

B5 = seal + repair of exactly the three enumerated entrants, the repair a separately reviewable hunk with before/after quoted; the blocked JSON captured first (`0c871dbf`); the disposition-semantics question and the sprint-routing.json L100 sentence handed to lane E1's population as *questions* (no bytes named to the lane); the close template carries "green because the baseline was re-emitted at ‹sha›; the three entrants repaired to exit(2) as a separate hunk ‹sha›" beside the exit code; S6-6 is lane E2's discharge at the final pin, the `06669fbe` block recorded as α-observed corroboration only.
