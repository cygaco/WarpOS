# β — the dead claude pass is a REGRESSION of β's own 2026-06-17 ruling; the enforcer it required is report-only on exactly this failure — row 337, msg_id `7a2c93e5-4f18-4b06-9c27-e0d581b3f429`

- **Decision:** DECIDE · class B · 0.93 (both links verified at source). Retro material, not a scope change (§6). Sent identically to team-lead and Epsilon.
- **α verification (β's Not-read #1):** `security-pass-count.js` IS wired into `/scan:full` (`.claude/commands/scan/full.md` L129); run 2026-08-29 it exits 0 and prints for EVERY security review "completed 0/3 (or 1/3) distinct providers ok (of 2 pass records) — the 3-pass review did not fully succeed"; `--strict` exits 1. → **LOUD-BUT-UNREAD, not not-running.** Filed as an ED-374 amendment (live evidence, severity high). Disposition: successor pulls the ramp tail together with the ED-383 fix.

## 1. The June dates are β's — a regression of a defect β ruled on that day
The only two claude security ids are `d-mqipp0zf` (2026-06-17) and `d-mqxc05j5` (2026-06-28). **2026-06-17 is β's own boundary consult approving the third pass** (opened from the record, not the index): "THE LOAD-BEARING CATCH: `second_pass` is consumed by NO dispatch code… adding `third_pass` makes the enforcers aware of it but does NOT cause a Claude pass to FIRE. Key-only + doc-update = a declarative lie." Approved Class B 0.88 with four ship-together conditions and two riders — "verify α actually did (b)+(c)+(d), not just (a)… if only the registry key changed, the 3rd pass is declared-but-not-firing" and "confirm the enforcer-or-debt for pass-count exists." The two firings are the change's own test window; then two months of silence in exactly the named shape.

## 2. Condition (d) was discharged — the enforcer names β in its header
`scripts/checks/security-pass-count.js` L3-5: "the NAMED pass-count enforcer for the 3-provider security review (β DECIDE 0.88 condition d…)". Rider 2 discharged. **Rider 1 never was** — nobody checked whether the thing could actually fail.

## 3. ⚠️ Why two months passed — verified at source, L8-21
Two halves at different strengths: **(A) CONFIG coherence — HARD, exit 1** (3 passes declared, distinct providers, claude present and LAST, `dispatch-review.js` exists, `epsilon-runtime.js` routes to it) — every item currently TRUE, which is why every config-level check today came back clean; **(B) RUNTIME stamps — REPORT-ONLY, `--strict` to block** (L20 "Exit: 0 clean (or report-only runtime gaps)"). **The half that would catch a dead pass is the half that exits 0.** The declarative lie reopened one level up: the system verifies rigorously that the pass is correctly DECLARED and softly that it ever RUNS — same shape, one layer out, in the control built to prevent it.

## 4. The ramp had an exit condition and nobody pulled it
L17-18: "Report-only until the gauntlet path is proven across a watch window (ramp tail = run with `--strict` in scan:full)." No date, no owner; two months unpulled. ED-374's mechanism named: **a report-only ramp with no deadline and no owner is a permanent report-only** — without a pull trigger the ramp IS the terminal state. Prediction (α confirmed): if half (B) runs in `/scan:full`, it has been reporting this gap the whole time and nobody read it — CLAUDE.md's "telemetry a signal someone actually reads".

## 5. Self-observation
β's 06-17 advice "order it LAST so the two cross-provider passes aren't skipped on a truncated run" (codified L55-57) was right on diversity grounds — and put the additive pass where a silent drop is least visible. Not a mistake; an unanticipated interaction between a diversity-ordering rule and a silent-drop failure: **the least-load-bearing item in a chain is the one whose disappearance is least noticed — an argument for per-item stamps, not reordering.**

## 6. Does NOT reopen lane B's scope
ED-374 class, correctly deferred under `d0c5b2e7`'s narrowing, which stands. What changes: the successor's evidence base — ED-374 now carries a live two-month in-house outage on a security control, discovered only because an unrelated sprint looked; travels by name under S6-7.

PRECEDENT: β's 2026-06-17 boundary consult (verified at source) · DP-gap #41(b) · ED-374 · ED-382 · P-055/AP-8 · row 289 (a PARTIAL lane can FIRE but never CLEAR).

## Not read (β)
Whether `security-pass-count` runs in `/scan:full` and its post-cutoff window (**α: yes, L129; reporting the gap on every review**) · the rest of `security-pass-count.js` beyond L1-57 · `dispatch-review.js` L76-82 and body · whether the two June claude ids were pass-3 dispatches specifically · whether June conditions (b) and (c) ever landed.
