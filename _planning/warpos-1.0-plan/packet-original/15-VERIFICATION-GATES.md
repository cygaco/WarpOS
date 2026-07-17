# Verification Gates

## Gate philosophy

A WarpOS 1.0 feature is not done because a file exists. It is done when a check can prove it works or a named human gate tracks the remaining manual action.

## Global gates

```bash
git status --short
node scripts/state/doctor.js
node scripts/events/validate.js
node scripts/checks/tracker-fidelity.js
node scripts/dispatch/doctor.js --json
```

Use actual live script names if different.

## Truth/release gates

- release metadata consistency
- release checksum verification
- README generated metadata check
- command catalog parity
- manifest parity
- hook registry parity
- path registry parity
- ship/install coverage

## Instruction gates

- build generated files from source
- no root Alpha poison
- nested instruction conflict scan
- instruction byte budget scan
- Claude bootloader imports AGENTS.md
- Codex loads AGENTS.md test command
- Gemini context file import test if Gemini support is implemented

## Dispatch gates

- WorkOrder schema validation
- ResultEnvelope schema validation
- provider health/auth/quota smoke
- route resolver fixtures
- raw provider CLI guard
- cross-provider review invariant
- prompt-size floor
- commit/evidence close gate
- no same-role self-review

## Liveness gates

- STARTED record exists before spawn
- no silent 0-byte completion
- hard kill produces unknown/death record
- reaper pings before reaping
- process absence alone cannot trigger terminal death
- output growth prevents reap
- commit with missing record creates ledger-vs-git warning

## Worktree gates

- wrapper sets cwd
- raw worktree flags not forwarded unsafely
- dependent builders branch from live HEAD
- stale-base fixture fails before fix, passes after
- commit/evidence stamped in ResultEnvelope

## Sprint gates

- plan has exact files/commands/env vars
- plan has `verified_by`
- plan has do-not-reopen table
- plan has stop-and-ask gates
- plan has do-not-build list
- blast radius warning/block
- tracker mirrored at phase boundary
- no Alpha manual bypass when roster required

## Founder panel gates

- every checklist item has panel item
- every panel item has owner/status/verify_by/evidence
- no invented env vars
- panel store readable by Alpha
- founder-only secrets rules present
- stage gate reads panel state

## WebApp baseline gates

- route matrix generated
- signed-out access tested
- API routes probed as direct calls
- rate limits present for auth/upload/AI/costly routes
- CSRF/origin check for cookie-auth mutations
- input validation at server boundaries
- error boundaries present
- observability configured or explicitly deferred

## Supabase/Next gates

- service_role not client-reachable
- RLS enabled for user tables
- policies tested by operation
- storage RLS for private buckets
- explicit grants migration
- live RLS proof
- roles not user-writable

## Demo/MVP/Launch gates

- demo data cannot show to real signed-in users
- OAuth provider is published or testers are allowlisted
- prod/demo env separation
- key rotation confirmed
- live/test payment mode appropriate
- privacy/ToS/refund/cookie consent
- monitoring and incident runbook
- backup readiness

## Hidden eval gates

- false green fixture
- tracker drift fixture
- stale worktree base fixture
- founder guide correctness fixture
- launch readiness fixture
- security baseline fixture

## Evidence naming

Store evidence under a governed path such as:

```text
_reports/warpos-1.0/<sprint-id>/<work-order-id>/
```

or the existing WarpOS report path registry.

Every ResultEnvelope should link to evidence paths.
