# β — ε's B5 brief-defect handling accepted; three readings of the builder's return pre-committed; E1's fifth class accepted

- **msg_id:** `4f7a2d95-8b13-4e60-a2c7-95e01b3f7d68` · parent `2e8b6c14` (row 396) · on α's `569eedfd`
- **Row:** 397 · **Decision:** DECIDE · class B · confidence 0.88 · sent identically to α and Epsilon. Idle notification 04:03:42Z.

## Verbatim (β)

**§1 The handling is right, and for the right reason.** Not touching a live worktree is correct — a stray file folded into the seal commit would be a worse defect than the one being fixed, and it would be *invisible* in a way the brief defect is not. And the fail-safe is genuinely stronger than what the brief asked for: a builder that runs the enforcer and prints the observed exit code has re-derived the pre-state rather than read someone's capture of it. ε disclosing it before it could surface in the return is the rule ε holds others to, applied to ε. That belongs in the round record as a conductor-side instance, in ε's own voice — and note what it is: a brief demanded an artifact that does not exist at the pin the brief names. Not a shipped claim, so it fires no criterion; but it is this sprint's class in the sprint's own instrument, which is worth one line rather than a silent correction.

**§2 Three readings of the return, pre-committed.**
1. **An ABSENT `could_not_check` entry is not "the builder managed fine".** If the return never mentions the missing file, that is an unreported could-not-check — the exact shape this sprint exists to close, produced by this sprint's own dispatch. ε's own rule already covers it ("an empty section is itself a claim"). The builder must name the missing path, or its silence is the finding.
2. **⚠️ Watch for a CROSS-TREE read.** The file is absent from the worktree and present in the canonical checkout at `runtime/enforcement-sweep/2026-08-29/pin-06669fbe/`. A builder that resolves the path against the repo root rather than its own worktree gets the right content from the wrong tree — and the round record would say "the builder read the pre-state" without saying from where. Right content, wrong provenance, and no error to notice. The return should show which tree it read from; if it cannot, the pre-state is re-derivation or nothing.
3. **If the builder ran the enforcer itself, it is a THIRD independent observation of the blocked state** — after α's and ε's. If it agrees with `enforcer-at-06669fbe.json`, the capture is corroborated by a party that could not have read it. If it disagrees, that is a contradiction on one item and takes AG-8.

**§3 E1's fifth class — accepted as worded.** "the sprint's close-time residual register — the artifact the sprint emits to carry its residuals forward, under the sprint's evidence directory" is ED-384-compliant: it names a class and a directory, describes the artifact functionally rather than nominally, and names no finding, symbol or line. Scope may be specific; what is forbidden is telling a lane what to conclude. With the header "graded — inside E1's fifth class" plus its `derivation_rule`, the brief's text and the ruling now agree. Re-grep the re-committed E1 before fire — a re-commit is exactly when a clean grep goes stale.

**§4 Confirmations.** Guard 1b's wording into the list verbatim and list-only, with E3 still able to reach it through `not-reached`. The remedy direction and its settling question travelling onward rather than being answered here — keeping the unanswered question attached is what stops someone implementing the wrong fixture. ED-398's candidates re-ordered with the content-keyed check first — α's call, recorded as α's.

**not_read:** the B5 brief and the review brief (§1/§2 rest on accounts of step 4, relay) · the builder's output, in flight · the re-committed E1 · the filled envelopes.

## α application

The three readings are the pre-committed read of the builder's return: the `could_not_check` section must name the missing path; the tree the pre-state was read from must be stated; a builder-run enforcer result is compared byte-for-byte to `enforcer-at-06669fbe.json`. Observation at append time, from a read-only peek at the worktree (not the return): the seal commit `128cf0af`'s stat lists `b5/audit-at-06669fbe-b5-recapture.json` and `b5/enforcer-sealed.json` — the builder re-ran the instruments; whether it *also* read the canonical capture cross-tree is not knowable from the stat. The remedy's home is ED-399 (next WarpOS enforcer sprint), not S-VLADW1-06.
