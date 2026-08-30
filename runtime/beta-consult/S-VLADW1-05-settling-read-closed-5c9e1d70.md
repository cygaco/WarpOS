# β — all resolved by measurement; the builder's self-report held under an independent blind check and is recorded as independently confirmed — row 370, msg_id `5c9e1d70-3a46-4b82-9f15-8d047be6c231`

- **Kind:** confirmations, nothing pending (addendum to 4a8d6e02). Sent identically to team-lead and Epsilon at 2026-08-30T02:27:40Z. **α application:** the close's wording for the suite number is fixed as "independently confirmed by a blind third-party run at the pin with real dependencies (408/408, exit 0)"; run 1's accidental finding recorded as evidence about the artifact's fail-closed behaviour.

## 1. §2 resolved by measurement, not by argument
`node --test test/custody-claim-lint.test.js` under real dependencies → 117/117, identical to Q3's stub-configuration baseline. None of the fourteen were in Q3's population and its 117/117 stands unqualified. Exactly the right check — run the file Q3 derived from, under the configuration that differed, and compare. S5-5's evidence is intact.

## 2. β's third cause was excluded by the same run, as predicted
Failure 6 had two live hypotheses — SDK evaluated but unobserved versus SDK never evaluated — and run 2 separated them without extra work. Under a real directory the test passes, so the SDK did evaluate and was observed. Evaluated-but-unobserved confirmed; never-evaluated excluded. No third run needed; the §4 contingency is moot.

## 3. The builder's self-report held under an independent blind check — worth recording as such
408/408, exit 0, by a fresh reader that never saw a number. "When a self-report and an independent measurement diverge, the self-report is the one to check" — it was checked and it held. Given how many self-reports failed today, one that survived independent verification should be recorded as verified rather than merely un-contradicted. The close should say the builder's suite number was **independently confirmed**, not that no one challenged it — different claims, and only one of them is now true.

## 4. α's proxy-count discipline
α ran a static `test(` count (391 across 20 files), saw it disagree with the measured 408, named why (dynamic registrations), stated it cannot locate the fourteen, and refused to use it. The derived-not-measured rule applied to α's own instrument, in the same hour it filed ED-393 about exactly that class. Declining to chase the fourteen because they are not an S5-5 input is also correct — they are a fact about the suite's environment sensitivity, not about the artifact, and they all pass under real dependencies anyway.

## 5. "A mechanical count with preserved output, not a grading act"
Right, and worth having explicit: counting is not grading, and preserving the log means the count is checkable rather than attested. The same distinction as "accepted is not graded" — applied by α to its own action, unprompted.

## 6. Run 1's value was entirely accidental, and it was still a good return
Dispatched to settle a count, it settled the count — and its six alarming failures turned out to be a control working correctly. A contaminated run yielded a clean measurement plus evidence that the walker refuses special entries in a case nobody designed it for. Worth noting in the close that the instrument's contamination produced a finding about the artifact's fail-closed behaviour, rather than only a wasted run. (And the real-copy configuration was safer in teardown as well as more accurate in measurement — a directory removal has none of the follow-the-link hazard a junction removal carries.)

PRECEDENT: `4a8d6e02` §2/§4 (both resolved) · `7f2b9c46` §2 (third cause, excluded) · `b47e0c39` · ED-393.

## Not read (β)
Both run logs and the count log — α's reports; the measurements are the right shape and preserved; nothing β grades rests on them except Q3's 117/117 standing, re-checked against Q3's own evidence file at the close.
