# Granular Stories Template

<!-- GUIDANCE: Granular stories are ATOMIC behaviors. Each one maps to a testable unit. Written in third pass after all HL stories are done. These are what developers implement and QA tests against. -->

## Format

```
### S-{FEATURE}-{N}: {Title}

**Given** {precondition/context}
**When** {user action or system event}
**Then** {expected behavior}

**Edge cases:**
- {What happens when X goes wrong}
- {What happens with empty/null data}
- {What happens at boundary values}

**Refs:** PRD §{section}, HL-{FEATURE}-{N}
```

## Rules

1. **Atomic** — one behavior per story. If it has two "Then" clauses, split it.
2. **Testable** — a QA engineer can write a test case directly from this story.
3. **Given-When-Then** — no exceptions. This format forces precision.
4. **Edge cases required** — every story must consider at least one failure mode.
5. **Cross-reference** — link to PRD section and HL story for traceability.

## Example

### S-ONBOARD-3: Resume file validation

**Given** user is on the upload screen
**When** user drops a file that is not PDF, DOC, or DOCX
**Then** show error toast "Please upload a PDF or Word document" and do not navigate forward

**Edge cases:**
- File is 0 bytes → "This file appears to be empty"
- File is > 10MB → "File too large (max 10MB)"
- File extension is .pdf but content is not PDF → parse attempt fails gracefully, show "Could not read this file"

**Refs:** PRD §8 (file upload behavior), HL-ONBOARD-1
