# Lane evidence — `security-reviewer` / agy (CROSS-FAMILY) — S-VLADW1-03 gauntlet-3 (QUALIFYING RUN)

Shape: `subprocess-cross-provider` via `scripts/dispatch-agent.js` · provider `antigravity` ·
model `gemini-3.1-pro-high` · `WARPOS_AGY_PRINT_TIMEOUT=300s` · dispatched from the WarpOS canonical root.
Record: `d-mtdcb3tf-9cba8fdd` **ok:true**. Raw: `out-security-agy.json` (4141 B, output 1892 B).
Brief: `lane-security-agy.md` (31655 B).

**Verdict: FAIL.** `p_class_claim_holds: no` · `prior_findings_repaired: yes` ·
**S1 holds · S2 FAILS.**

**This is a real verdict, not a BLOCKED/partial marker** — conductor-verified: `ok:true`, `error: none`,
and the envelope carries a populated `findings` array and `files_i_could_not_see` list.

Read-scope: served toolless-inline, handed `src/env-scrub.js` COMPLETE plus a `src/spawn-shim.js` excerpt
(the Z1 choke-point CLASS claim and the call it guards). It ran nothing; every finding correctly carries
`execution_proven: false`. It listed all seven files it could not see, unprompted.

**It confirmed the repair of its own prior findings** (`prior_findings_repaired: yes`) — the gauntlet-2
partial-list gap it found is genuinely addressed by 10d's full-history sweep.

## THE FINDING — an asymmetry inside 10d's own repair. Third round running, third real cross-family catch.

> **F-1 · LOW · S2 · `src/env-scrub.js`**
> Claim under test: *"The re-scrub guarantee (capture-and-delete) holds regardless of what names list any
> particular call passes."*
> Precondition: *a caller passes a partial list omitting a previously-captured name, and that omitted name
> was unprovisioned at startup but provisioned mid-session.*
> `precondition_established_by_text_i_saw: true` · `execution_proven: false`

Its reasoning, verbatim in substance: **the ABSORPTION loop iterates only over the current call's
`namesArr`, but the DELETION loop sweeps the full history in `capturedNames`.** So a previously-captured
name omitted from the current call is **deleted from `process.env` without ever being checked for
absorption**. If that omitted name was provisioned mid-session, *"its value is destroyed and can never be
retrieved via `getCapturedCredential()`, breaking legitimate consumers."*

Severity LOW, and the grading is right: every shipped caller passes a full list, so it is unreachable in
production. **But it falsifies the explicit S2 claim that the mechanism itself safely handles partial
lists** — which is exactly the claim 10d added when it moved the guarantee from INSTANCE to CLASS.

`residuals_wrong_or_missing`: *"The comments claim the mechanism is safe regardless of what `names` list a
caller passes, but omit the residual that passing a partial list permanently destroys mid-session
provisioned values for any omitted names by deleting them without absorbing them."*

`files_i_could_not_see`: `src/spawn-shim.js` (full), `src/server-entry.js`, `driver/host-free-driver.js`,
`src/model-seam.js`, `CUSTODY.md`, `test/env-scrub-capture.test.js`, `test/env-scrub.test.js`.

## Conductor note — cross-family value, and a near-miss that corroborates it

The three Claude lanes did NOT file this. The `backend-reviewer` lane came closest: its own F-4 (LOW,
`execution_proven: false`) circled the same `capturedNames` bookkeeping, observed that the first call stores
`namesArr.slice()` undeduplicated while later calls rebuild from a Set, **attempted to construct a case where
a name is lost and explicitly could not**, and filed it as a robustness observation rather than a defect.
agy, reading the same file without tools, named the precise asymmetry that the backend lane could not
construct — absorption is current-call-scoped, deletion is full-history-scoped.

Two independent lanes converging on the same code region from opposite directions, one unable to construct
the case and the other naming it, is stronger evidence than either alone. **The standing rule holds: a
finding all three Claude lanes miss is not thereby cleared.**

## Dispatch note — two infrastructure failures before this run, neither a review signal

- `d-mtdc9tj0-f796f39a` **ok:false** — payload BLOCKED: *"assembled command line 32442 chars exceeds the
  32000 bound (Windows CreateProcess ceiling minus margin) — the payload is BLOCKED, never
  truncated-and-sent (RIDER-1). Account this run as the lane BLOCKED (agy-unavailable-equivalent), NEVER a
  partial-review pass."* **The real ceiling is 32000 assembled, not 32768** — a correction to the recorded
  figure. Fail-closed and correct. Payload retrimmed to 31655 B.
- `d-mtdcau3p-42a74da9` **ok:false** — `WARPOS_AGY_PRINT_TIMEOUT=300` rejected: *"missing unit in duration
  \"300\""*. The value needs a unit: `300s`.

Both are recorded as ok:false in the ledger, which is correct — neither is a lane verdict, and neither may
be read as a pass or a partial review.
