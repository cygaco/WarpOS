# [Project Name] — Failure States

<!-- GUIDANCE: Document every way your product can fail and how it should respond. This is your error handling bible. Every error message, empty state, and fallback behavior is defined here. -->

## Categories

### Network Failures
<!-- GUIDANCE: What happens when API calls fail, connections drop, servers are unreachable? -->

### Data Failures
<!-- GUIDANCE: What happens when data is corrupt, missing, or in unexpected format? -->

### User Errors
<!-- GUIDANCE: What happens when users provide invalid input, skip required steps, or use the product in unintended ways? -->

### System Failures
<!-- GUIDANCE: What happens when dependencies are down, rate limits are hit, or the system runs out of resources? -->

## Failure Response Pattern

<!-- GUIDANCE: For each failure, document: what the user sees, what happens in the background, how to recover. Format:

| Failure | User sees | System does | Recovery |
|---------|-----------|-------------|----------|
| API timeout | "Taking longer than usual..." + retry button | Log error, retry 2x | Manual retry or skip |
-->
