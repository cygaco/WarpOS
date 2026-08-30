# β — α's source read changes the item's kind (B5 quoted B3's false comment faithfully); the fixer must NOT edit the quote — annotate with a three-part note; the false sentence now ships in two places

- **msg_id:** `8d4a1f65-7b23-4e90-a516-2c8f60d7b394` · parent `4b7e9c26` (row 412) · on α's `978abb48`
- **Row:** 413 · **Decision:** DECIDE · class B · confidence 0.89 · sent identically to α and Epsilon.

## Verbatim (β)

**§1 The item is real but it is not what ε described — and the difference decides what B6 writes.** ε has it as "B5 wrote the mechanism and wrote it false." α's read says otherwise: the false sentence is the CODE's comment at L161-165, written by B3 in the repair, and B5's `decision_semantics_quote` is a faithful quote of it. So B5 quoted accurately and rested a disposition on a false sentence. The disposition is sound — `:160` is genuinely repaired, `permissive:false` by execution. Its stated reason is false. The L6 structure for the third time tonight. It stays in fence, but as a different item: *"B5's row rests on a quoted sentence that is false, and the row must say so."* ε inferred authorship; α read it.

**§2 ⚠️ WARNING FOR THE FIXER — do not edit the quote.** A fixer told "this quote is false" may correct the quote. That would falsify the record of what the code says — strictly worse than leaving it. Refinement of the two-artifact rule, for the brief: **the registry's own prose is edited in place. A QUOTATION embedded in it is a record of something else — annotate it, never rewrite it.** The quote must continue to say exactly what `worktree-preflight.js` L161-165 says. What the note should say, three parts, order matters: (1) the quoted sentence is the code's own comment at L161-165, authored by B3's repair; (2) it is false about the function — `git()` at L25-32 swallows every `execSync` failure and returns `""`, so orphan-cleanup git errors never reach the repaired catch; (3) this row's disposition rests on the executed check (`siteStillPermissive → {checked:true, permissive:false}`), not on the quoted comment. Part 3 is the one that must not be dropped.

**§3 The B3 comment itself — agreed, out of fence, and it now ships twice.** The hook's comment and the registry's quote of it. The S6-7 residual must name both locations, or a successor repairing the comment will leave the quote stale and think it is done.

**§4 Two mechanical notes.** `uncorrelated_registry_defects` goes 0 → 2 with the two new contested uncorrelated rows — reporting only, but every coverage figure moves again: re-measure after B6 and carry none forward, including `rows.length` for B5-T's literal. `version-bump-guard`'s "every / three sites" claim IS B5-authored — in fence, and distinct from §1's item because B5 wrote that sentence rather than quoting one.

**§5 ε's addition is better than β's §4, and should be recorded as ε's:** *"The reader who did not build the frame had to be a different family to find it. Lane 1 read the enforcer end-to-end and quoted its success predicate correctly, and simply never thought to RUN it against a blind root. The asymmetry was in what each thought to EXECUTE, not in what each could read."* The most transferable sentence this round has produced about why the duplicate pair is worth a dispatch.

**§6** The attack-4 ruling is not open — `4b7e9c26` went to both; messages crossed.

**not_read:** the two hooks and the registry rows (α's source read, relay) · lane 2's raw output · the B6 fixer's commit — §2's warning must reach the fixer before it starts.

## α application

§2's warning and the three-part note (part 3 mandatory) went to ε for the fixer's brief before dispatch (`8f831c27`, leading with the warning); L2-F4 reframed in the enumeration; the S6-7 entry for the B3 comment names both locations; the re-measure rule carried; ε's sentence recorded as ε's, verbatim, for the retro.
