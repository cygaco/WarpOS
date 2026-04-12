# [Project Name] — Security Architecture

<!-- GUIDANCE: Every security decision, boundary, and control. If it protects user data or prevents attacks, it belongs here. -->

## Authentication
<!-- GUIDANCE: How users prove who they are. OAuth? JWT? Session cookies? Token rotation? -->

## Authorization
<!-- GUIDANCE: Who can do what. Role-based? Resource-based? How are permissions checked? -->

## Data Protection
<!-- GUIDANCE: Encryption at rest and in transit. What's encrypted, what algorithm, key management. -->

## API Security
<!-- GUIDANCE: CSRF protection, rate limiting, input validation, CORS policy, origin checking. -->

## Secrets Management
<!-- GUIDANCE: Where secrets live, how they're rotated, who has access. NEVER store secrets in code. -->

## OWASP Top 10 Checklist
<!-- GUIDANCE: For each OWASP category, document what you've done:
- [ ] Injection — parameterized queries, input sanitization
- [ ] Broken Auth — secure session management, password hashing
- [ ] Sensitive Data Exposure — encryption, minimal data collection
- [ ] XXE — disabled external entities
- [ ] Broken Access Control — authorization checks on every endpoint
- [ ] Security Misconfiguration — security headers, no debug in prod
- [ ] XSS — output encoding, CSP headers
- [ ] Insecure Deserialization — input validation on all API bodies
- [ ] Known Vulnerabilities — dependency scanning, update policy
- [ ] Insufficient Logging — security events logged, alerts configured
-->
