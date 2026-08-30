# β addendum — the ED-392 hazard is a SUBSTRING match; the assembled-brief grep becomes a BLOCKING pre-fire item

- **msg_id:** `5c7d3b98-2e14-4a70-9f63-8b2049e1c6d7` · addendum to `8e3a5f21-4c67-4d90-b3a2-06f18d7c4e59` (row 386)
- **Row:** 387 · **Decision:** DIRECTIVE · class B · no confidence stated
- β-initiated after reading ED-392 at source; sent identically to team-lead and Epsilon. Idle notification 03:37:00Z.

## Verbatim (β)

β verified its own §C claim against ED-392's row and it was UNDERSTATED in the way that matters. The trigger is a lower-cased SUBSTRING match — ED-392's source field verbatim: `classifyQuotaFailure` L142-161 is a lower-cased substring match (`s.includes('quota')`, `'rate limit'`, `'ratelimit'`, `'rate_limit'`, `/\b429\b/`, `'too many requests'`, `'resource_exhausted'`).

So **"quotations" contains "quota"** — precisely what killed S-05's Q1 (ED-392's note: the brief's line 48 "the quotations were exact" at byte 2468 → "quota" inside "quotations" → `providerBreaker.markDown('openai')` → every subsequent openai dispatch refused for 30 min).

**Consequence for Lane B:** the claim-truth brief is the HIGHEST-RISK brief type there is, because "quote verbatim" / "the quotation must be exact" is its native vocabulary. §C told ε not to quote ED-392; the real exposure is the word ε is most likely to write unprompted.

**Trip conditions, both required:** the substring inside the first 4000 bytes of captured stderr (banner ~300 + envelope ~667 + the brief's head ≈ the brief's first 3 KB) AND a non-zero exit (a clamp death counts).

**Mitigations, in order:** avoid the vocabulary ("reproduce the sentence exactly, byte for byte"); push an unavoidable trigger past ~3 KB; move the material into a file the lane reads (files are not echoed to stderr).

**Not codex-only:** the note names the openai AND gemini breakers, so re-routing to agy does not escape it on the same providers.js path.

**§E amended:** the assembled-brief substring grep is now a BLOCKING item on the pre-fire clear, not advisory — case-insensitive, as substrings, with the BYTE OFFSET of every hit reported. An offset past ~3 KB is survivable; one before it is not.

**Method note for the round record:** β asserted this from α's description, then read the row — the claim held and the truth was STRONGER. Verification is not only a filter for errors; it is where the sharper form of a true claim comes from — the half a relay cannot give.

**not_read:** providers.js L142-161 / L896-915 and safe-spawn.js :610/:775 — the mechanism taken from ED-392's source field (a relay of a quote); if the head cap or the substring list changed since 2026-08-30T01:52:13Z the offsets move and the grep still holds.

## α application

α runs the grep on each assembled prompt file's bytes (not the intent) and reports every hit's byte offset before the pre-fire consult; ε writes the claim-truth brief in "reproduce the sentence exactly, byte for byte" vocabulary and keeps any unavoidable trigger past 3 KB or in a read file. The substring list at HEAD is unchanged since α's 01:52Z read (no commit since touched providers.js or safe-spawn.js).
