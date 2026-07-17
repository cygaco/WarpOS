# ResultEnvelope Schema Template

```json
{
  "schema": "warpos/result-envelope/v1",
  "id": "RE-...",
  "work_order_id": "WO-...",
  "role": "...",
  "provider": "...",
  "model": "...",
  "runtime": "...",
  "started_at": "...",
  "completed_at": "...",
  "status": "passed|failed|partial|blocked|timeout|quota_exhausted|provider_unavailable",
  "files_changed": [],
  "commits": [],
  "tests_run": [],
  "evidence_paths": [],
  "errors": [],
  "followups": [],
  "verdict": "..."
}
```
