# WorkOrder / ResultEnvelope Spec

## Purpose

A WorkOrder is the job ticket sent to a model or agent.

A ResultEnvelope is the receipt/proof returned by that model or agent.

Together they let WarpOS use Claude, Codex, Gemini, or future models without changing the company architecture.

## WorkOrder size

A WorkOrder can include multiple child tasks, but it must be a coherent unit.

Ideal shape:

```text
one role
one objective
one lane/domain
one branch/worktree
one bounded file set
one review path
one ResultEnvelope
2–7 child tasks
3–8 expected files touched
1–4 hours wall-clock max
```

Split when:

- different role is needed
- different reviewer is needed
- different domain/layer is touched
- same files need parallel edits
- auth + billing + UI + migrations are mixed
- acceptance cannot be proven with one command set
- more than roughly 8 files are expected
- a new Beta/Product decision is needed

## WorkOrder schema

```json
{
  "schema": "warpos/work-order/v1",
  "id": "WO-...",
  "sprint_id": "SP-...",
  "epic_id": "E-...",
  "role": "frontend-builder",
  "provider_policy": {
    "allowed": ["claude", "openai", "gemini"],
    "preferred": "openai",
    "fallback": ["claude"],
    "requires_provider_diversity_from": ["reviewer"]
  },
  "objective": "...",
  "context": {
    "summary": "...",
    "must_read": [],
    "may_read": [],
    "do_not_read": []
  },
  "scope": {
    "allowed_files": [],
    "forbidden_files": [],
    "expected_files": [],
    "max_expected_files": 8
  },
  "tasks": [],
  "acceptance_criteria": [],
  "verified_by": [],
  "stop_and_ask": [],
  "do_not_build": [],
  "timeout": {
    "soft_minutes": 20,
    "hard_minutes": 60
  },
  "lease": {
    "type": "one_shot|wave|phase|session",
    "heartbeat_minutes": 5,
    "ping_before_reap": true
  },
  "output_contract": {
    "result_envelope_required": true,
    "evidence_required": true
  }
}
```

## ResultEnvelope schema

```json
{
  "schema": "warpos/result-envelope/v1",
  "id": "RE-...",
  "work_order_id": "WO-...",
  "sprint_id": "SP-...",
  "role": "frontend-builder",
  "provider": "openai",
  "model": "...",
  "runtime": "dispatch-codex",
  "started_at": "...",
  "completed_at": "...",
  "status": "passed|failed|partial|blocked|replaced|timeout|provider_unavailable|quota_exhausted",
  "branch": "...",
  "worktree": "...",
  "files_changed": [],
  "commits": [],
  "tests_run": [
    {
      "command": "npm run typecheck",
      "exit_code": 0,
      "evidence_path": "..."
    }
  ],
  "acceptance_results": [],
  "evidence_paths": [],
  "errors": [],
  "followups": [],
  "verdict": "..."
}
```

## Mandatory validation

A WorkOrder is invalid if:

- no role
- no objective
- no allowed files for build roles
- no forbidden files for build roles
- no acceptance criteria
- no `verified_by`
- no timeout/lease
- no output contract
- prompt is too small for feature-build work
- multiple owners/roles are mixed

A ResultEnvelope is invalid if:

- no work_order_id
- no status
- claims passed without evidence
- claims changed files but lists none
- claims tests passed with no command output/evidence
- no provider/model/runtime recorded
- no commit/evidence for build roles
- failure lacks classified reason

## Prompt-size floor

For feature-build WorkOrders, block dispatch if the generated prompt is below a configured floor, e.g. 2 KB. Doogle proved tiny stub prompts can produce hollow ok:true records with zero real changes.

## Close gate

A WorkOrder may close only if:

- ResultEnvelope validates
- evidence exists
- `verified_by` commands ran or are explicitly deferred with reason
- reviewer path completed where required
- tracker/state updated
