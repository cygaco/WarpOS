# SP-20260618-002 build_spec (product-lead, GPT-5.5, design step) — E-MC-READINESS-ANALYSIS-001

ANALYSIS-ONLY. All of β's design→build HOWs (DECIDE B 0.88) baked in: the diff-scope close-gate, the
enumerated allowlist, Track-5 supersession-as-auditable-line, A2 positive-coverage, 2-source security.

```yaml
build_spec:
  sprint: SP-20260618-002
  epic: E-MC-READINESS-ANALYSIS-001
  mode: ANALYSIS-ONLY
  invariant: "Modify no product/framework/runtime code except enumerated report/tracker outputs and runtime evidence."

  global_scope_guard:
    allowed_writes:
      # Authored analysis artifacts + the A3 doc-reconcile surface (the ONLY hand-edits):
      - _reports/E-MC-READINESS-track1-hardening-simulation.md
      - _reports/E-MC-READINESS-findings-register.md
      - trackers/epics/E-MC-READINESS-ANALYSIS-001-release-readiness-analysis.md
      - ROADMAP.md
      - TRACKER.md
      - runtime/sp-20260618-002/**
    allowed_generated_artifacts:
      # MANIFEST-ALLOWLIST GAP CLOSED (DoE caveat, β must confirm): A3 edits ROADMAP.md+TRACKER.md
      # which are hash-tracked (BC-02/BC-05) → the mandatory manifest regen touches these GENERATED
      # views. They are generated-artifacts-of-an-allowed-doc-edit, NOT hand-edited product/framework
      # source — so the diff-scope gate must PERMIT them (else A3's legit reconcile RED-fails its own
      # gate). The gate treats a delta here as allowed ONLY because its SOURCE edit (a doc above) is
      # allowed; a delta here with NO corresponding allowed-doc edit would still be suspicious.
      - _warpos/MANIFEST.json
      - .claude/framework-manifest.json
      # paths.json/lib.generated are NOT expected (no paths.registry edit this sprint); if they appear,
      # the gate FAILS (that would mean an unexpected source edit leaked).
    forbidden_diff_paths:
      - product/**
      - framework/**            # NB: framework/ SOURCE, not the generated framework-manifest at .claude/
      - scripts/**
      - .claude/commands/**
      - .claude/agents/**
      - schemas/**
      - patterns/**
    close_gate: >-
      On the sprint branch, `git diff --name-only main...HEAD` must intersect ONLY allowed_writes ∪
      allowed_generated_artifacts. ANY forbidden_diff_paths entry, OR any path outside both sets, fails
      the light-gauntlet FAIL-CLOSED. The gate MUST also fail-closed on: empty/error diff, detached HEAD,
      git-command failure (never silent-green — the false-green class).
    enforcer_shape: >-
      The gate LOGIC lives in a runtime/sp-20260618-002/ helper (analysis-only-diff-gate.js) WITH a
      negative-case self-check (a planted forbidden path → asserts the gate returns FAIL); the inline
      light-gauntlet check DELEGATES to it. NOT a bare inline one-liner (can't prove it fails closed).
      Do NOT commit a scripts/checks/ enforcer this sprint (that write itself violates analysis-only).
    promote_to_execution: >-
      The permanent enforcer is an EXECUTION finding: "add a NEW scripts/checks/analysis-only-diff-gate.js
      (or generalize scripts/checks/framework-purity.js, which already does git diff --name-only) as a
      post-hoc, allowlist-parameterized close-gate." Do NOT name scope-contract-guard.js (dispatch-TIME
      guard = wrong seam; naming it creates a downstream seam-ownership defect). write-time vs merge-time
      = two enforcers.

  units:
    - id: A1
      goal: "Extend sealed-capsule foundation across the CONSUMER-REACHABLE command FLOW and produce Track-1 hardening findings — command-flow COMPOSITION signal, not a track-3 re-derivation."
      inputs:
        - scripts/warpos/test-sealed-capsule-gate.js   # the foundation; reuse seal→tmpdir-isolate→lifecycle (injectable runStep/runCell, lines 408-598)
        - runtime/sealed-gate-full.log
        - _reports/E-MC-READINESS-track3-edge-cases.md  # the 5 structural classes C1-C5 to CONFIRM/REFUTE at flow level (do NOT re-derive)
        - "consumer-reachable command surface discovered by read/grep/glob only"
      envelope_DoE:   # director-of-engineering ruling (recorded d-mqk5wn8b, ok:true)
        in_scope: "the install/update spine (setup→scan:install→sprint→telemetry→update, both roles × cold+warm) + the headless-Console entry verbs: /sprint:full (no --sprint), /portfolio:new + in-place spinup/scaffold, /warp:update apply+rollback, /admin:* + /panel:* ONLY where they mutate shared state."
        out_of_scope_archaeology: "/research:*, /scan:* internals, dev-tooling skills, non-shipped scripts, redteam/qa lanes — cite-and-skip."
        anti_sprawl_line: "would the Master Console invoke this verb programmatically against a fresh consumer repo? Yes→in; No→archaeology."
        unique_value: "command-FLOW COMPOSITION — confirm WHICH of track-3's C1-C5 actually FIRE end-to-end in the sealed lifecycle vs are masked by an earlier step (a static read cannot see this)."
        highest_leverage_probe: "drive the warm/update + parallel-resume cell in the sealed repo with a BOM-injected framework-installed.json — composes C1 (BOM read) × C2 (non-atomic write) × C5 (dest traversal) in ONE flow; tells EXECUTION whether the foundation gate already catches them or they slip the sealed contract."
        finding_frame: "every finding tagged CONFIRMS-track3-Cx | NEW-at-flow-level | REFUTES, with sealed-run evidence (confirm/refute, not re-derivation)."
      steps:
        - "Map launch-relevant consumer-reachable command coverage from the foundation test/log."
        - "Drive the real lifecycle in the SEALED isolated repo (os.tmpdir, canonical-unreachable, rmSync in finally); exercise the in-scope verbs; run the BOM-injected warm/update+parallel-resume probe."
        - "For each of track-3's C1-C5, record CONFIRMS / NEW-at-flow / REFUTES with the sealed evidence."
        - "Stop at launch-relevant fragility; no fixes, redesign, archaeology, or code changes."
      output:
        path: _reports/E-MC-READINESS-track1-hardening-simulation.md
        shape: "Track summary; coverage matrix (verb × cold/warm × fired/masked); exercised/skipped/failure modes; findings table {source, severity, reproducibility, evidence, readiness risk, execution-route, C1-C5-relation}; explicit limitations; the '0 writes outside _reports/ + runtime/sp-20260618-002/ + tmp' assertion."
      verified_by:
        - "Every finding has source + severity + reproducibility + execution-route + its track-3-Cx relation (CONFIRMS/NEW/REFUTES)."
        - "No finding proposes in-sprint remediation (analysis-only)."
        - "A1's doc records '0 writes outside _reports/ + runtime/sp-20260618-002/ + tmp' (the simulate-while-analysis-only enforcer)."
        - "Diff-scope close-gate passes."

    - id: A2
      goal: "Consolidate Tracks 1,2,3,4,6 plus explicit Track-5 supersession into the release-readiness findings register."
      inputs:
        - _reports/E-MC-READINESS-track1-hardening-simulation.md
        - "_reports/E-MC-READINESS-track{2,3,4,6}-*.md"
        - "E-SYSTEM-ORG-001 reference for Track-5 supersession coverage"
      steps:
        - "Extract every finding from the 4 existing complete docs plus A1."
        - "Deduplicate only with explicit dup/absorbed markings; preserve provenance for all source findings."
        - "Cross-check Track-5 claim: add line 'Track-5 file-org absorbed into E-SYSTEM-ORG-001 @ <ref>, findings covered there' or surface register-completeness GAP."
        - "Reconcile SECURITY with GPT + Claude two-source pass; document gemini TIER-DEAD absence as honest debt and keep divergence-as-signal."
        - "Prioritize by severity, launch-reachability, enforcement-gap, unblocking-value, containment."
        - "Bucket entries into must-fix-before-launch, should-fix, backlog."
      output:
        path: _reports/E-MC-READINESS-findings-register.md
        required_row_schema: "stable_id | track | source_doc | source_finding_ref | status(preserved/dup/absorbed/new/gap) | title | severity | priority(P0/P1/P2) | launch_reachability | evidence | reproducibility | execution_route | owner_epic | bucket | notes"
        required_content:
          - "Track coverage statement for 1,2,3,4,6 plus Track-5 SUPERSEDED."
          - "P0 includes false-confidence/ED-033-class plus 2 high security findings."
          - "P1 includes 10 high-sev edge cases grouped by 5 structural classes plus pipeline/sealed-capsule integrity."
          - "Every entry routes to EXECUTION or is marked no-action/accepted; no orphan findings."
      verified_by:
        - "Positive-coverage cross-check: every finding from each source doc appears in register as preserved, dup, absorbed, or gap."
        - "'6 tracks consolidated' is allowed only with count/coverage evidence, not artifact existence."
        - "Security reconciliation records GPT + Claude agreement/divergence and gemini absence."
        - "Diff-scope close-gate passes."

    - id: A3
      goal: "Finalize analysis epic/tracker metadata truthfully from A1/A2 without changing product/framework implementation."
      inputs:
        - _reports/E-MC-READINESS-track1-hardening-simulation.md
        - _reports/E-MC-READINESS-findings-register.md
        - _reports/E-MC-READINESS-track{2,3,4,6}-*.md
        - trackers/epics/E-MC-READINESS-ANALYSIS-001-release-readiness-analysis.md
        - ROADMAP.md
        - TRACKER.md
      steps:
        - "Credit Tracks 2/3/4/6, record Track-5 supersession, and reference A1/A2 outputs."
        - "Update DoD checkboxes only where evidence supports completion."
        - "Correct completion percentage and active-epics status to reflect analysis-only deliverables."
        - "Do not mark EXECUTION fixes complete."
      output:
        paths:
          - trackers/epics/E-MC-READINESS-ANALYSIS-001-release-readiness-analysis.md
          - ROADMAP.md
          - TRACKER.md
        shape: "Truthful status, evidence links, Track-5 supersession note, A1/A2 artifact references, corrected percentage, analysis-only caveat."
      verified_by:
        - "A3 runs last after A2 register exists."
        - "DoD checkboxes map to actual artifacts/evidence."
        - "Diff-scope close-gate passes and any forbidden product/framework/scripts/.claude diff fails closed."
```

## ε note (carried to build) — DoE consult folded (d-mqk5wn8b, ok:true)
- Diff-scope gate shape CONFIRMED by DoE (0.86): runtime/sp-20260618-002/ helper WITH a negative-case
  self-check + inline gauntlet delegation; fail-closed on empty/error/detached-HEAD/git-fail; permanent
  enforcer = an EXECUTION finding naming a NEW analysis-only-diff-gate.js (or generalize framework-purity.js),
  NOT scope-contract-guard (wrong seam). All folded into global_scope_guard.enforcer_shape/promote_to_execution.
- MANIFEST-ALLOWLIST GAP CLOSED (DoE's load-bearing caveat): global_scope_guard.allowed_generated_artifacts
  now permits the regenerated _warpos/MANIFEST.json + .claude/framework-manifest.json as generated-artifacts-
  of-an-allowed-doc-edit, so A3's legit regen doesn't RED-fail its own gate. paths.json/lib.generated NOT
  expected (no paths.registry edit) → if they appear the gate FAILS (an unexpected source edit leaked).
  This is the one thing DoE said β must confirm before signing — now resolved in the build_spec; β to ratify.
- A1 envelope folded into the A1 unit (consumer-reachable command FLOW, anti-sprawl line, the BOM-injected
  warm/update+parallel-resume highest-leverage probe, CONFIRMS/NEW/REFUTES framing, the 0-writes-outside-
  allowed assertion as the simulate-while-analysis-only enforcer).
