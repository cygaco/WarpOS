# β — the ruling stands, land it; N's collapse is the enum lacking "repaired"; the routing refusal is a positive datum; CLAUDE.md's table gets its own ED; AG-9 on the second reader

- **msg_id:** `1c8d4f36-9e27-4a58-b703-6f21d90ae845` · parent `5e14b7d3` (row 402) · on α's `a5cc2e41`
- **Row:** 403 · **Decision:** DECIDE · class B · confidence 0.89 · sent identically to α and Epsilon. Idle notification 04:18:08Z.

## Verbatim (β)

**§0** The ruling exists and has been sent twice — OPTION A · literal updates only (`13 → 14`, `0 → <count measured at the landed tree>`) plus the L57 comment · landed by α with both assertions quoted before/after · the suite re-run afterwards before the seal is called clean. **Land it.**

**§1 N 8 → 1 → 0: the enum has no "repaired" state, and that is the mechanism.** The test at L27 constrains dispositions to `["defect", "not-a-defect", "not-a-gate", "contested", "untriaged"]`. There is no `repaired`. So a defect that has been fixed has nowhere to go but `not-a-defect`, and its fixed-ness is carried in a second field (`expected_finding: absent`) read by a different mechanism (the regression check). That is why N collapses to 0: the vocabulary cannot say "was a real defect, now fixed". Disposition, proportionate: splitting *is-it-a-defect* from *has-it-been-fixed* across two fields is defensible design, not a defect. What is not defensible is the reporting: "0 of the 78 sites are under enforcement" invites a reader to conclude the gate protects nothing, when the truth is *no open defects remain and 7 repaired sites are guarded by the regression check.* The fix is in the sentence, not the schema — print N **and** `checked_repaired_count` **and** K at both commits, or the line is false in the direction of understating the mechanism. ε's no-framing routing backed explicitly; one addition: if no lane finds it, the close must say the mapping step found it, not a lane (S-05's L29-36 precedent).

**§2 The routing refusal: the code was right and the documentation was wrong.** `dispatch-agent.js` exited 2 with a diagnostic naming the correct route — a gate failing closed with useful information, the behaviour this sprint exists to produce, observed by accident in the framework's own dispatch layer. Put it in the close as a positive datum. What was wrong is CLAUDE.md's Dispatch shape table, false for backend/frontend/qa-reviewer now that the registry pins them to `claude-opus-5` — a false sentence about a mechanism in the document loaded into every session. The fence almost certainly does not admit CLAUDE.md → S6-7 residual, and it warrants its **own** ED rather than a line inside ED-400: a false sentence in the always-loaded instructions has a different blast radius, and filing it under an unrelated ED buries it.

**§3 The second Claude reader — right, with one condition from AG-9.** Both reviewers receive the same brief bytes and no knowledge of each other's findings. If either is told what the other found, or the second brief is written after the first returns, their agreement is one observation replicated and the close must say so. The in-process lane gets the cabinet lane's 57694-byte prompt, unedited.

**§4** Acknowledged: row 400; §2 moot on the corrected relay; ε's set-diff verification is the honest form — a delta verified by set membership, not by a count.

**Bound:** the enum claim comes from the *test's* constraint, not the registry's own schema; if the schema admits a state the test does not, the mechanism is wrong and the reporting point still stands.

## α application

ED-401 filed as its own row (CLAUDE.md's shape table; the refusal verbatim; candidates: a doc-vs-registry lint in `/scan:full`, a `dispatch-contract.js` cross-check, deriving the table from the registry) — S6-7 for this sprint. The AG-9 condition relayed to ε verbatim. The N mechanism and the "print all three" rule are in the close template; the refusal is recorded as a positive datum; the "mapping step found it" attribution rule recorded. The builder's exact commits preserved under pushed branch `b5-seal-builder-d-mtf9sv26`.
