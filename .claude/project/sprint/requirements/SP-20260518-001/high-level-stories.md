# High-Level Stories — /sprint:full

**Sprint:** `SP-20260518-001`
**PRD:** `paths.sprintRequirements/SP-20260518-001/prd.md`

## H-1 — Single-invocation pipeline

**As** an operator
**I want** to type `/sprint:full "<request>"` once and have the full pipeline run end-to-end
**So that** I get the leverage of the sprint workflow without the per-phase keyboard cadence
**Linked requirements:** `R-1`, `R-7`, `R-9`
**Linked granular stories:** `S-1`, `S-2`, `S-3`, `S-4`, `S-5`, `S-6`, `S-7`, `S-10`

## H-2 — Preset-bounded autonomy

**As** an operator
**I want** to pick an autonomy preset (`conservative` / `moderate` / `aggressive`) that matches my risk tolerance for this sprint
**So that** I can dial how much the orchestrator may do on my behalf without lifting hard ceilings
**Linked requirements:** `R-2`, `R-12`
**Linked granular stories:** `S-11`, `S-12`

## H-3 — Inviolable hard ceilings

**As** an operator
**I want** to be confident that no preset can bypass push-to-remote, paid services, production deploy, destructive migrations, or secrets handling
**So that** "no approvals" never means "no safety"
**Linked requirements:** `R-3`, `R-12`
**Linked granular stories:** `S-11`

## H-4 — Halt clarity

**As** an operator
**I want** a single resume command and a structured halt report when /sprint:full stops mid-run
**So that** I know exactly which gate fired and what action is needed without grepping the tracker
**Linked requirements:** `R-4`, `R-7`
**Linked granular stories:** `S-8`, `S-9`, `S-10`

## H-5 — Beta-honored ESCALATE

**As** Alex Beta
**I want** my ESCALATE verdict to halt /sprint:full regardless of preset
**So that** judgment-model concerns are never silenced by an "aggressive" run
**Linked requirements:** `R-5`
**Linked granular stories:** `S-15`

## H-6 — Operator-extensible preset

**As** a framework maintainer
**I want** to extend autonomy presets by editing the JSON config without modifying `full.js`
**So that** policy stays separated from orchestration code, and per-environment tuning doesn't require a code change
**Linked requirements:** `R-2`, `R-10`
**Linked granular stories:** `S-11`, `S-12`, `S-13`, `S-17`

## H-7 — Auditable run timeline

**As** a sprint analyst
**I want** a `sprint-full-report.md` after each run showing phase durations, halts, decisions, and what was auto-approved
**So that** I can audit autonomous behavior after the fact and tune presets based on real evidence
**Linked requirements:** `R-4`, `R-7`
**Linked granular stories:** `S-9`, `S-19`
