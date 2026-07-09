# WorkOrder Schema Template

```json
{
  "schema": "warpos/work-order/v1",
  "id": "WO-...",
  "role": "...",
  "objective": "...",
  "scope": {
    "allowed_files": [],
    "forbidden_files": [],
    "expected_files": []
  },
  "context": {
    "summary": "...",
    "must_read": [],
    "may_read": [],
    "do_not_read": []
  },
  "tasks": [],
  "acceptance_criteria": [],
  "verified_by": [],
  "stop_and_ask": [],
  "do_not_build": [],
  "lease": {
    "type": "one_shot",
    "heartbeat_minutes": 5,
    "ping_before_reap": true
  },
  "timeout": {
    "soft_minutes": 20,
    "hard_minutes": 60
  }
}
```
