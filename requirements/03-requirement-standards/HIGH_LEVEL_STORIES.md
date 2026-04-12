# High-Level Stories Template

<!-- GUIDANCE: HL Stories capture user INTENT and OUTCOMES, not implementation details. Written in second pass after all PRDs are done. Each story is one user goal. -->

## Format

```
### HL-{FEATURE}-{N}: {Title}

**As a** {user type}
**I want to** {action/capability}
**So that** {outcome/value}

**Acceptance:** {What "done" looks like — observable outcome, not code}

**Emotional target:** {How the user should feel when this works}
```

## Rules

1. **Platform-neutral** — describe outcomes, not mechanisms
2. **One goal per story** — if you write "and", split it
3. **Verifiable acceptance** — a human can confirm it works by using the product
4. **Emotional target** — every story should name the feeling it produces
5. **Reference PRD** — each HL story maps to a PRD section

## Example

### HL-ONBOARD-1: Upload my resume

**As a** new user
**I want to** upload my resume
**So that** the system can understand my background

**Acceptance:** User drags or selects a file, sees it parsed into structured fields within 5 seconds.

**Emotional target:** Effortless — "that was easy, it understood my resume"
