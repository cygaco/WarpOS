# SP-20260720-002 — QA-PLAN (Phase 4: Trusted enforcement adapter)

> Authored by quality-lead (in-process, opus). **Conductor reconciliation:** I handed quality-lead riders 1+4 verbatim + the gates, so it RECONSTRUCTED riders 2/3/5/6 from acceptance-record.js. The AUTHORITATIVE 6 β riders are in build_spec.md §5 (DoE mapped them correctly). quality-lead's reconstructed extras (forge-invalid-cannot-authorize, produce-override-cannot-bypass-schema, cas-newhead-binding-reachable) are GOOD BONUS coverage of acceptance-record.js's existing ED-238/240 hardening — keep them as additional falsifiers, but the binding rider→fixture map is record-trust-gate.md.

## Priority ranking (product-priority-over-severity)
Golden user of this feature = the resumed/other-session conductor performing the irreversible `git update-ref` into main. Vulnerable user = every future sprint whose work is silently corrupted if a bad tree integrates. Highest-priority failure mode = a **false-green on the merge-into-main path** (silently integrates unverified work, no downstream catch). Depth spent accordingly:
- **P0:** un-brokered/forged/self-asserted merge into main (G4.4, rider-1, G4.2); fail-closed default-deny (G4.3 ×8); which-checker-runs (G4.1, G4.6).
- **P1:** check-library reachability+drift (rider-4); helm-runner required/optional.
- **P2:** CORE-2 flip; ED-215 close; honest-promise scope.

## RED-by-skip rule (design→build gate)
Any trust surface lacking a required-present falsifier that (a) EXISTS and (b) fails CLOSED (skips RED until the module is built, never passes green on absence) = the false-green surface is unfalsifiable = design-incomplete → the gate refuses to advance. This is mechanically checkable: walk the record-trust-gate.md registry, fs.existsSync each named file, confirm each is RED-by-skip (unbuilt) or RED-failing (built, gate absent).

## Positive-companion discipline (defeats a reject-everything stub)
Every REFUSE falsifier is paired with a positive fixture proving the gate AUTHORIZES a legitimate case (a constant `authorizesIntegration=()=>false` / a block-everything controller would pass ALL falsifiers while integrating nothing). The primitive ships this contract (produceForTest / acceptance-positive-companion.test.js EXISTS). Per-gate positives are named in record-trust-gate.md. A falsifier without a live positive companion is INCOMPLETE — the gate counts positive companions as required-present too.

## Distinct-reason contract (dead-gate defense, ED-240 lesson) — a BUILD PRECONDITION
The controller MUST expose distinct machine-checkable `reason` strings per gate — especially the 8 G4.3 default-deny modes. If all 8 collapse to a shared `not-authorized`, an earlier gate short-circuited and the manifest logic is a dead gate: reachability is unprovable. Each mode must be individually diagnosable (the record-trust-gate.md registry lists the exact reason per fixture). This is a no-ship precondition, not a nice-to-have.

## Meta-gauntlet plan — THIS sprint's own review
Registry-FIXED roster (I do NOT choose reviewers): backend-reviewer (Check-7 on CONTROLLER+HELM-RUNNER) · qa-reviewer (functional 13 personas + traceability [the AC↔fixture↔code matrix IS the spine] + integrity [honest-promise exact-match, no hallucinated deps]) · security-reviewer (BUNDLE integrity + G4.1/G4.4/G4.6 attack surface). **Effort: HIGH** (NOT ultra — dies on the 540s foreground clamp; an ultra consult on the CAS/CORE-2 flip goes to α for run_in_background). **Family: 2-family (GPT+Claude) ONLY** — NO 3-lab self-claim; exit proof draws on ZERO agy attested:true / ZERO spike. The HELM-RUNNER's own exit proof (one full WorkOrder→Envelope→checked-integration) runs on codex (non-Claude) with portable invariants recorded by the dispatch control plane. Every verdict BINDING — I synthesize, I CANNOT override a FAIL. Gauntlet-verify liveness: in-process lanes land an evidence-bound ok:true record-inprocess (no faked records).

## Risk accepted / one thing that would change the call
- Accepted: the honest-promise boundary — artifact-verification+integration SLICE of CORE-2 ONLY; a determined hostile operator with local shell is OUT (operator-DROPPED). The honest-promise-scope assertion keeps us from silently overclaiming past that line.
- Would change the call: if the controller does NOT expose distinct per-gate reason strings, G4.3 moves from Deep-covered to design-incomplete/no-ship.
