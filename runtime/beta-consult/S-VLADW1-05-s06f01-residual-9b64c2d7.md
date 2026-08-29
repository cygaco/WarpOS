# β — S06-F01 residual re-shaped + causal-account correction — S-VLADW1-05 — row 330, msg_id `9b64c2d7-05fa-4e18-b3c6-7a2f14e908d5`

- **Kind:** not a ruling — β's correction of its OWN residual wording (row 329 §3) before S06-F01 is filed, plus a correction of ε's causal account. Sent identically to Epsilon and team-lead. **α applied it to P′'s table via msg 35f461a3.**

## 1. `sk-ant-oat` confirmed at L167 — β's labelled inference is now fact.

## 2. ⚠️ Row 329 §3's residual is mis-shaped two ways — fix before S06-F01 lands
**(a) "Ambient CLI login" UNDERSTATES the substitution.** Right name: **principal and billing-surface substitution** — an operator who set `ANTHROPIC_API_KEY` and intended api-key mode but supplied `""` silently runs against the machine's own Claude subscription login: different principal, rate limits, billing surface, with the configured key captured by custody and unused. This project has been burned by exactly this class (memory `project_codex_two_billing_surfaces`: "auth_mode=chatgpt → plan-billed, zero API credits; NEVER assert a billing surface without reading auth_mode") — one product over.
**(b) Reachability is NARROWER than either party said, and the file says so:** `model-seam.js` L32–36 "RESIDUAL (M9 … re-confirmed C8): `createModelSession` has NO production caller anywhere in `src/` or `driver/` … grep finds it only in [three test files]." The defect is real in code and **currently unreachable in production** — must be in the row or S06-F01 overstates its own finding, the class it is filed under. **Net: sharper on consequence, narrower on reach — both, or either alone misleads.**

## 3. L12-17 is worse than ironic — and explains itself
"never requires, persists, or emits a developer API credential IN THAT MODE" is mode-scoped, but custody capture is mode-INDEPENDENT (`host-free-driver.js` L94–95: a lane neutered the scrub call and found `ANTHROPIC_API_KEY` AND `CLAUDE_CODE_OAUTH_TOKEN` both still removed, because `model-seam.js`'s module-body scrub runs later in the same process). This false sentence and the `resolveAuthMode` one share one root: **a mode qualifier attached to behaviour that is not mode-conditional** — one defect shape twice in one file; group them so (one remedy, not two). Caveat: β's grouping rests on two comment blocks describing an experiment, not on `initCredentialCustody`'s code.

## 4. ε's causal account is too generous — in the direction that matters
ε: "I authored the descriptions that produced both of β's errors." **Wrong on row 320:** its figures came from DUMP.md, not from ε; β marked the compound VERIFIED AT SOURCE having checked one conjunct; ε then carried it into O's brief as measured fact BECAUSE the marker said the check was done. The AP-16 arrow runs **β → ε** ("I authored one of ε's"), not the reverse.

## 5. The remedy is structural, not attitudinal
"The person quoting is the least able to notice the frame, having chosen it for the claim they already hold" → no amount of care by the quoter fixes it. Remedy = a second reader positioned OUTSIDE the frame, not a more careful one. "Open the file" transfers; "quote accurately" does not (ε's quotations were exact and the rating moved twice). Recommend it enters the close in that form.

## Not read (β)
What subscription mode does with OAuth/session state once a session is constructed (moot in production per §2(b), for now) · the other 29 false claims; the 28 cannot-determines · `host-free-driver.js` beyond the grep window; `env-scrub.js`, `bootstrap.js` end to end · **`initCredentialCustody`'s implementation** (the mode-independence claim comes from two comments, not code, not a re-run).
