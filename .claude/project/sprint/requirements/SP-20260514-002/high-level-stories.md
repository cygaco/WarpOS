# High-Level Stories — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`

## H-1 — Durable provenance per sprint artifact

**As** Alpha
**I want** every sprint artifact (Plan Contract, design pack, executed ticket, QA report, Redteam report, release record, retrospective) to carry a routing-trace row identifying the model_class that drafted it and, when required, the second-vendor model that diff-reviewed it
**So that** drift between declared routing and actual execution is observable and auditable instead of invisible.

Outcome: A query like `routing.js coverage --sprint <id>` answers "did this sprint follow its routing policy?" in <100ms by reading append-only JSONL.

## H-2 — Drift fails at write-time, not retro

**As** an operator
**I want** the system to refuse to finalize a sprint artifact when its routing trace is missing
**So that** I find out about the gap when I can still fix it cheaply, not after the sprint has shipped.

Outcome: A new PreToolUse Edit|Write hook (`sprint-routing-guard.js`) blocks writes to sprint artifact paths when no matching trace exists. The hook honors `enforcement.mode = warn|block` for soft-rollout.

## H-3 — Single-vendor sessions don't break

**As** an operator running with only one provider configured (e.g., Claude-only, no OpenAI/Gemini key)
**I want** diff-review enforcement to fall back honestly when a second vendor is unavailable
**So that** my sprints continue to run and the trace records the constraint truthfully.

Outcome: `routing.js record` writes `evidence: single_vendor_session`, appends a row to `paths.decisionLedger`, and exits 0. The release gate accepts single-vendor traces.

## H-4 — Release is gated on routing coverage

**As** an operator running `/sprint:release`
**I want** the command to refuse release when any required phase lacks a routing trace
**So that** I do not ship a sprint that silently bypassed the policy on a key phase.

Outcome: `release.js` invokes `routing.js coverage` and surfaces a one-line coverage summary; non-zero exit on missing required phases. Optional phases (`docs_sync`, `tracker_updates`, `trace_updates`) do not block.
