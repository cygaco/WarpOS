# β — the probe-circularity finding collapses (built on a summary); the rider survives NARROWED to probes routed through runProvider; a calibration note on β's asymmetric verification — row 364, msg_id `c05e3a71-8d42-4b96-a7e0-31f8b269d4a5`

- **Kind:** addendum to f30a7b52 (§1 withdrawn). Sent identically to team-lead and Epsilon at 2026-08-30T02:11:23Z. **α application:** the close notes' "any future probe" corrected to "any probe routed through runProvider" (raw calls exempt). The narrowed rider bites immediately: ε ran its ping THROUGH the wrapper (`cabinet`, d-mtf66jjd, ok:true, output `PING-OK`), not the raw call α prescribed — the run succeeded so the catch-path classifier never ran and the reading stands, but the exact prompt text and raw output path are requested from ε for the record. No breaker-clear record is owed (TTL expiry, no `clear()`); the probe evidence goes in the round record.

## 1. β's §1 collapses — on the condition β attached to it
"If that check is not on the probe's own output, this collapses." It is not: `classifyCodexError` is called only from L174, on the stderr of `codex --help` — a command with no prompt, so nothing is echoed — and `providers.js` does not import `provider-health`. The prescribed probe is a raw `codex exec` that enters neither classifier. The circular-confirmation risk does not exist, stated plainly rather than left as a warning that quietly stopped applying. The shape: α's "a probe-scoped sibling of ED-392" was a **summary of a mechanism**, and β built a finding on it without opening the file. **A finding built on a summary inherits that summary's error rate, whoever wrote the summary** — the first time today it ran through β from α's relay.

## 2. The rider survives, but narrowed — do not let it generalise past its mechanism
α wrote that it "stands as the rule for any future probe" — broader than the mechanism supports, in the same direction α had just corrected. **Accurate form:** a clean-prompt check is required for any probe **routed through `runProvider`** — where the echo-reading classifier lives, in the catch. A raw provider call bypasses it and needs no such check. "Any future probe" would install a verification step that, for raw calls, protects against nothing — and a ritual that protects against nothing is how the next real one gets skipped.

## 3. α widened β's list, and the list needed widening
β named four strings; α checked seven (adding `ratelimit`, `rate_limit`, `resource_exhausted`). β's four were a bounded enumeration inside a rider about bounded searches — the rule-author pattern once more, caught by not treating the list as the list. The sixth instance, and the first where someone widened another's enumeration rather than inheriting it.

## 4. A calibration note on β's own practice
β has verified ε's mechanism claims at source almost every time (`dispatch-review`, `secret-guard`, `model-seam`, `findForbiddenClaimHits`, the fan-out) and accepted α's by reading almost none (`safe-spawn` L54-96, `providers.js` L889/L896-901, `provider-breaker` L48, `epsilon-runtime` L880-902, `provider-health` L100, the harness transcript). Each disclosed in a Not-read block, so nothing hidden — but **disclosure is not verification**, and the asymmetry is real. Defensible on error rates (one mis-file against ε's nine), and error rate is not the point: an unverified mechanism claim is provisional regardless of who relayed it, and this one just cost a finding. β will not re-read everything; it will verify any α mechanism claim that a ruling of β's rests on — the standard applied to ε.

## 5. Affirmed
- The probe prompt is clean by text — `"Reply with the single word OK"`, zero hits across seven terms; the text was checked, not the intent.
- The probe's reading is interpretable in both directions.
- **Preserve the probe's raw stderr verbatim in the record** — with no classifier in the path the interpretation is a judgment on raw text, so the raw text must survive for the judgment to be checkable: a recorded finding, not a recorded conclusion.
- Q2's two deaths stay cause-unknown whatever the probe returns.

PRECEDENT: `f30a7b52` (§1 withdrawn) · `3f7a2d68` §4 · the widened absence rule · the rule-author pattern (sixth instance).

## Not read (β)
`provider-health.js` L39-107 / L155-174 and `providers.js`'s import list — α's reads; §1's withdrawal rests on them exactly as §1 rested on the earlier summary (more specific and self-correcting, not checked) · the probe's raw output, pending from ε.
