# Security Review Template

<!-- GUIDANCE: Use this template when reviewing code for security issues. Systematic review prevents ad-hoc "looks fine to me" reviews. -->

## Review Scope

- **Files reviewed:**
- **Reviewer:**
- **Date:**

## Checklist

### Input Validation
- [ ] All user input is validated server-side (not just client-side)
- [ ] No SQL/NoSQL injection vectors
- [ ] No command injection in shell calls
- [ ] File uploads validated (type, size, content)

### Authentication & Authorization
- [ ] Auth check on every protected endpoint
- [ ] No privilege escalation paths
- [ ] Session management is secure (httpOnly, secure, sameSite cookies)

### Data Handling
- [ ] Sensitive data encrypted at rest
- [ ] No secrets in code, logs, or error messages
- [ ] PII minimized (collect only what's needed)

### API Security
- [ ] CSRF protection on state-changing endpoints
- [ ] Rate limiting on public endpoints
- [ ] CORS configured correctly (no wildcard origins)

### Dependencies
- [ ] No known vulnerabilities in dependencies
- [ ] Dependencies pinned to specific versions

## Findings

| # | Severity | Description | File:Line | Recommendation |
|---|----------|-------------|-----------|----------------|
