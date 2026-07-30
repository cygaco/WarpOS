# Invariants pass — LANE 1 (I1 success-path) — verifier verdict

- **Lane:** I1 success-path only (I1.a–I1.f). Lane 2 (I2/I3 failure + rollback) has **NOT run**. Lane I4
  (report-state totality) is complete. **This is not the verdict of the invariants pass.**
- **Subject:** `scripts/checks/memory-apply.js` @ `8adf768b` (run at `.worktrees/sp002-r14/`).
- **Route:** β's DEFINED FALLBACK (`8a3d5f26` route ruling) — in-process Claude, `qa-reviewer`, model opus,
  synchronous, after **death #2** on the cross-provider route (both codex execution lanes: `ok:false`, zero
  output bytes, `fallback:true`, elapsed exactly 540s — the deterministic clamp; R4 artifact-probe satisfied,
  worktree clean, nothing landed late).
- **Elapsed:** 591s, 25 tool uses. **13 apply-probes EXECUTED**, 2 refused fail-closed (a preflight and a
  projection gate), **0 refused by a governance hold** — so this is a real verdict, not a `could-not-run`.
- **Positive proof the executor ran** (§6, not tell-absence): P1 observed `a.md` change 95 bytes /
  sha256-16 `75e141b7335bb60a` → 133 bytes / `63c2957e7737c85e`. Corroborated by P2, P3, P4b.
- **§8 TREE LIMITATION, carried in the lane's own verdict text:** a PASS here says **nothing** about shipped
  WarpOS 1.2.0, which ships **r13** — strictly worse, carrying S-3/S-5/B-6 unchanged **plus** the S-2 defect
  r14b fixed — and whose executor is HELD, so I1 is unreachable there. Unreachable is not sound.

---

## Per-invariant roll-up

| Invariant | Verdict | Decided by |
|---|---|---|
| **I1.a** intended content, exactly | **PASS** | on-disk bytes byte-equal to `newBody`, incl. absent trailing newline + multi-byte UTF-8. T2 precondition (correct on an absent target refused into I2) also PASS |
| **I1.b** intended removal | **PASS** | target absent from `E_post`, index line removed (−27 bytes = the whole line incl. terminator) |
| **I1.c** index fidelity on retained content | **FAIL** | retained-line CRLF terminators stripped to LF (CR count 4→0, and 2→0 in the supplementary probe) |
| **I1.d** no collateral content change | **PASS** | CRLF-authored and `0xFF`-carrying unrelated entries byte-identical on **both** the delete and correct paths |
| **I1.e** no collateral entries | **PASS** | across four success shapes (1–3 atomic writes plus unlinks): zero entries added, no `.memory-apply.*`, `E_post ⊆ E_pre` |
| **I1.f** introduces no structural finding | **PASS (weak — see ceiling)** | introduced-finding delta 0 on both successful applies |

**Both of β's REQUIRED positive probes ran and passed.** I1.d (a store holding two entries not named by the
plan — one CRLF-authored, one containing invalid UTF-8) and I1.e (residual working file after a **clean**
apply — the case β noted **nobody had ever probed**, since every prior round looked only after a failure).

---

## F-1 — the finding. Class **BF** (additionally TH). Severity **HIGH**.

A successful `delete` rewrites the line terminator of **every retained** index line, converting a
CRLF-authored `MEMORY.md` to LF, while reporting `ok:true, applied:true, postFindings:[]`,
`notes:["applied 1 mutation(s); post-check clean"]`, exit 0.

**Observed, with bytes:** `MEMORY.md` before = 111 bytes, 4 terminated lines, every terminator `0D 0A`,
CR count 4. After = 81 bytes, CR count **0**. Expected if I1.c held = 84 bytes (`25a381f40fe65dec`); actual
81 bytes (`e83a10c587d20cea`) — 3 bytes beyond the removed line, exactly the three surviving `0D`s. All three
retained lines went 28 B → 27 B with terminator `0D 0A` → `0A`.

**Sub-clause narrowing (the load-bearing detail).** A supplementary probe separated I1.c's three clauses on a
store whose index was CRLF-authored, carried a raw `0xFF` on a *retained* line, and had no trailing newline:
- (i) retained-line terminators preserved — **FAIL** (CR 2 → 0)
- (ii) invalid UTF-8 on a retained line survives — **PASS** (`0xFF` present after; `EF BF BD` absent)
- (iii) trailing-newline state unchanged — **PASS**

So **I1.c fails on sub-clause (i) only.**

**Exact fix site, one place** (`memory-apply.js`, r14 worktree @`8adf768b`): `splitLinesBytes` discards each
line's terminator including the CR (`if (end > start && buf[end - 1] === 0x0d) end -= 1;` around :649), and
`removeIndexLines` unconditionally rejoins with LF (around :687–692). The original terminator is not carried
through the split, so it is unrecoverable at the join. **The function's own doc comment states the intent as
policy** — "Line endings are normalized to LF (repo standard)" — so this is a **deliberate normalization that
contradicts I1.c**, not an oversight. Per §0 the resolution is fix-the-code or weaken-the-reported-claim,
never demote the invariant.

**Severity reasoning, against β's discriminator.** HIGH: the **store is in a state the report denies** — the
fields do not merely disagree with each other, they describe a store that is not the one on disk. The lane
explicitly considered deflating to MEDIUM on "semantically equivalent text, no content lost" and rejected it,
because §1 forecloses exactly that ("Byte fidelity means bytes… 'Semantically equivalent text' satisfies
nothing here").

**Relationship to ED-306 — the question for β.** ED-306 is an **already-open HIGH** describing this same
defect, previously established by code-reading. This lane **confirms it by observation** with byte evidence
and narrows it to sub-clause (i). Whether that counts as "**another** HIGH in the byte-fidelity or
transaction-honesty families" — the hard terminal's stated trigger — or as confirmation of one of the four
already open, is **β's ruling, not ε's**. ε has not written either outcome.

**No other findings.** The lane states it did not manufacture a second defect, and that the four §4
invariants with no named falsifier (I1.a, I1.b, I1.d, I1.e) — the ones at risk of passing by assumption —
were each probed positively with byte-level and entry-set evidence.

**A notable positive worth preserving:** the supplementary probe proves the **r14b S-2 fix genuinely holds**
in this tree — a raw `0xFF` on a retained index line came through as `0xFF` with no `EF BF BD` substitution
anywhere. The decode→re-encode corruption is really gone here. That is precisely the defect the **shipped r13
tree still carries**.

---

## Ceiling (the lane's own, recorded verbatim in substance)

1. **A PASS here says nothing about shipped 1.2.0** — see the §8 limitation above.
2. **I1.f's pass is structurally weak, not independent.** The post-check *is* the detector and requires zero
   findings over the whole store, which is strictly stronger than "no new finding"; a store carrying a
   pre-existing finding is refused by the prospective-store gate before mutation. So I1.f can only ever be
   evaluated over an already-finding-free store, and its delta is 0 **by construction**. Reported PASS as
   observed, but it is not independent evidence.
3. **Out of lane, unprobed:** I2 (ED-307), I3 (ED-308/ED-309), I4 totality. No fault injection ran, so §5's
   required adversarial case (b) — a failure induced late enough that content is already written — is
   untouched by this lane.
4. **§7 silences respected:** no concurrency probe, no durability probe; mode/ownership/timestamps not
   compared, so T5's "unclaimed is not licensed" class is unverified either way.
5. **Single platform:** Windows 11 / NTFS / node v24.16.0. The CRLF finding is platform-independent by
   inspection (the LF join is unconditional); the case-insensitivity behaviour probed is not.

**Scope contract honoured:** `git status --porcelain` on the subject worktree empty after all probes; no real
memory store read or written (the user store's mtime unchanged, predating the session). All 13 fixture stores
and the probe harness live under the session scratchpad.

---

## Status under β's composition rule

Under **R2** (`8a3d5f26`): the pass FAILS and the terminal fires if **any** lane reports a HIGH in BF or TH.
This lane reports a HIGH in BF. Under **R3**, on the Claude fallback route **a FAIL fires the terminal
normally, full stop** — the provisional-PASS caveat and its required cross-provider confirmation apply only
to a PASS, so no confirmation lane is needed to make this FAIL binding.

**The open question β must rule** is whether an observationally-confirmed **already-open** HIGH (ED-306) is
"another HIGH" for terminal purposes. **ε has not decided it and will not.** Lane 2 remains un-run, so the
pass is incomplete regardless, and per β's pre-commitment a lane can FIRE but never CLEAR.

β's ordering constraint is already satisfied: **ADR-0040 is committed** (it shipped in 1.2.0, on main at
`4af0ef59`), so any terminal-firing record's citations resolve from the tagged tree.
