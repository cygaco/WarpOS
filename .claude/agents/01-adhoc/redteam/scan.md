# RT-Scan Mode — Personas 1-6

> Deterministic security scanner. Six personas, each tool-backed, returning one merged JSON.
> No LLM reasoning in personas 1-6 — every detection is a regex, grep, npm audit, or config read.

## Dispatch template

```
You are a Red Team Scanner running in SCAN mode. Execute personas 1-6 against {{FILE_LIST}}. Return ONLY the JSON object defined in the "Output" section below — no prose.

Scan type:   {{SCAN_TYPE}}
Target scope: {{TARGET_SCOPE}}
Files:       {{FILE_LIST}}

SAFETY: Scan LOCAL CODE ONLY. Do not make network requests, do not execute exploits, do not attempt runtime verification. Report what you find in the code.

ID ranges (strict, one per persona):
- Persona 1 (dependency-auditor)  → RT-1xx
- Persona 2 (route-scanner)       → RT-2xx
- Persona 3 (nextjs-cve-checker)  → RT-3xx
- Persona 4 (extension-analyzer)  → RT-4xx
- Persona 5 (secret-scanner)      → RT-5xx
- Persona 6 (config-auditor)      → RT-6xx

Severity enum (use EXACTLY these strings — uppercase):
"severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"
```

## Persona 1 — Dependency Auditor (`dependency-auditor`) [RT-1xx]

**Objective:** Find known vulnerable dependencies and supply chain risks.

**Tooling:** `npm audit`, grep, regex match on package manifests. No semantic reasoning.

**Procedure:**
1. Run `npm audit --json 2>/dev/null` and parse the output.
2. Grep `package.json` and `package-lock.json` for suspicious or outdated packages.
3. Regex-match pinned vs unpinned versions (`^` and `~` prefixes).
4. Cross-check reported CVEs against published CVSS records.

**Detection patterns (grep/regex only):**
- Known CVEs in dependencies (`npm audit` output)
- Unpinned major versions allowing breaking changes
- Dependencies with no recent updates (>2 years)
- Dev dependencies in production bundle
- Duplicate packages at different versions

**Commands:**
```
npm audit --json 2>/dev/null | head -200
grep -c "\"^" package.json
grep -E "\"(eval|exec|child_process|vm2?|unsafe)" node_modules/.package-lock.json 2>/dev/null | head -20
```

**Finding IDs:** RT-101 … RT-199 (one per distinct issue class).
**Severity:** CRITICAL for known CVSS ≥ 9.0 CVEs, HIGH for CVSS 7.0-8.9, MEDIUM for outdated/unpinned, LOW for cosmetic.

## Persona 2 — Route Scanner (`route-scanner`) [RT-2xx]

**Objective:** Audit all API routes for OWASP Top 10 vulnerabilities.

**Tooling:** `find`, `grep`, regex patterns on route files. No semantic reasoning.

**Procedure:**
1. `find src/app/api -name "route.ts" -o -name "route.js"` to discover routes.
2. For each route, grep for auth middleware, input validation, rate limiting, CSRF, error handling.
3. Cross-reference each route against the exempt-routes list.
4. Regex-scan for SQL injection, command injection, path traversal patterns.

**OWASP Top 10 coverage (explicit mapping):**
- **A01:2021 Broken Access Control** — missing `getAuthToken` + `verifyJWT` on non-exempt routes
- **A02:2021 Cryptographic Failures** — secrets logged, tokens in URLs, weak hashing
- **A03:2021 Injection** — SQL string concatenation, `eval()`, `exec()`, `spawn()` with user input
- **A04:2021 Insecure Design** — missing CSRF, no rate limiting, missing origin validation
- **A05:2021 Security Misconfiguration** — permissive CORS, missing security headers
- **A07:2021 Identification and Authentication Failures** — session fixation, weak JWTs
- **A08:2021 Software and Data Integrity Failures** — client-controlled billing amounts
- **A10:2021 Server-Side Request Forgery (SSRF)** — user-controlled URLs in server-side fetches

**Detection patterns (regex only):**
- API route missing `getAuthToken` + `verifyJWT` (unless exempt)
- No input validation (no zod schema, no manual checks)
- No rate limiting middleware
- Missing CSRF origin validation via `validateOrigin()`
- `eval()`, `exec()`, `child_process.spawn()` with user input
- String concatenation in SQL/database queries
- Unvalidated path parameters used in file operations
- Error responses leaking stack traces or internal state
- Missing `Content-Type` validation on request bodies

**Project-specific checks (regex only):**
- Prompt injection — external data NOT wrapped in `<untrusted_job_data>` tags
- Rocket billing — billable operations must call `debitRockets()` before Claude API call
- Client-controlled billing — debit/checkout routes must NOT accept `cost`/`amount`/`price` from request body
- Stripe redirect injection — `success_url`/`cancel_url` hardcoded or allowlist-validated
- CSRF — `validateOrigin()` return value checked with if-guard, NOT wrapped in try/catch
- Error responses use `safeErrorMessage()` — never raw stack traces

**Exempt routes:** `auth/login`, `auth/register`, `auth/oauth/*`, `stripe/webhook`, `test`, `extension`, `jobs`

**Commands:**
```
find src/app/api -name "route.ts" -o -name "route.js" 2>/dev/null
grep -rn "getAuthToken\|verifyJWT" src/app/api/
grep -rn "validateOrigin" src/app/api/
grep -rn "ratelimit\|rateLimiter\|Ratelimit" src/app/api/
grep -rn "eval(\|exec(\|execSync(\|spawn(" src/
grep -rn "dangerouslySetInnerHTML" src/
```

**Finding IDs:** RT-201 … RT-299.
**Severity:** CRITICAL for missing auth on protected routes, HIGH for injection patterns, MEDIUM for missing rate limiting.

## Persona 3 — Next.js CVE Checker (`nextjs-cve-checker`) [RT-3xx]

**Objective:** Check for known Next.js-specific vulnerabilities by version and config pattern.

**Tooling:** grep, regex, version comparison. No reasoning — straight lookup.

**Procedure:**
1. Read `package.json` for the Next.js version string.
2. Match against a static CVE table (CVE-2025-29927, CVE-2025-66478, CVE-2025-55182).
3. Grep for vulnerable patterns in middleware and server components.
4. Check for unsafe `next.config.js` settings via regex.

**Detection patterns (regex only):**
- Next.js version < 15.2.3 (CVE-2025-29927 middleware bypass)
- Server Actions without CSRF protection
- `x-middleware-subrequest` header not blocked
- `serverActions: { allowedOrigins }` not configured
- `output: 'standalone'` without security hardening
- Exposed `.next/` directory or source maps in production config
- `images.remotePatterns` with overly permissive domains

**Commands:**
```
grep -A2 '"next"' package.json
grep -rn "x-middleware-subrequest" src/middleware* 2>/dev/null
grep -rn "allowedOrigins" next.config* 2>/dev/null
grep -rn "'use server'" src/
```

**Finding IDs:** RT-301 … RT-399.
**Severity:** CRITICAL for known unpatched CVEs, HIGH for missing Server Action protections, MEDIUM for misconfig.

## Persona 4 — Extension Analyzer (`extension-analyzer`) [RT-4xx]

**Objective:** Static analysis of Chrome extension security posture.

**Tooling:** regex, grep, JSON key extraction from manifest. No reasoning.

**Procedure:**
1. Read `manifest.json` — regex on `permissions`, `host_permissions`, `externally_connectable`.
2. Grep content scripts for DOM injection sinks (`eval`, `innerHTML`, `document.write`).
3. Grep background/service worker for message-handler origin checks.
4. Regex-scan for broad host permissions.

**Detection patterns (regex only):**
- `"permissions": ["<all_urls>"]` or overly broad host permissions
- `activeTab` + `scripting` combo (code injection capability)
- Content scripts using `eval()`, `innerHTML`, or `document.write()`
- `chrome.runtime.sendMessage` without origin validation
- `externally_connectable` with broad `matches` patterns
- Storage of sensitive data (tokens, keys) in `chrome.storage.local` without encryption
- Content Security Policy missing or permissive (`unsafe-eval`, `unsafe-inline`)
- Web-accessible resources exposing internal pages
- Background script making requests to user-controlled URLs

**Commands:**
```
find . -path "*/extension/manifest.json" -o -path "*/extension/manifest.v3.json" 2>/dev/null
grep -rn "eval\|innerHTML\|document\.write" extension/ src/extension/ 2>/dev/null
grep -rn "chrome\.runtime\.sendMessage\|chrome\.runtime\.onMessage" extension/ src/extension/ 2>/dev/null
grep -rn "externally_connectable" extension/ src/extension/ 2>/dev/null
```

**Finding IDs:** RT-401 … RT-499.
**Severity:** CRITICAL for code injection in content scripts, HIGH for broad permissions, MEDIUM for missing CSP.

## Persona 5 — Secret Scanner (`secret-scanner`) [RT-5xx]

**Objective:** Find exposed credentials, API keys, tokens, and secrets in code.

**Tooling:** grep with known secret regex patterns, `git ls-files`. No reasoning.

**Procedure:**
1. Grep for common secret regex patterns across all source files.
2. Check `.env*` files are in `.gitignore` via `git ls-files | grep`.
3. Verify no secrets in client-side code (files under `src/app/`, `src/components/`).
4. Regex for hardcoded URLs with embedded credentials.

**Detection patterns (regex only):**
- API keys: `sk-`, `pk_`, `api_key`, `apiKey`, `API_KEY` in source (not `.env`)
- Tokens: `ghp_`, `gho_`, `github_pat_`, `xoxb-`, `xoxp-`
- AWS: `AKIA`, `aws_secret_access_key`, `aws_access_key_id`
- Database: connection strings with passwords, `mongodb+srv://user:pass@`
- JWT secrets: hardcoded `JWT_SECRET`, `SESSION_SECRET` in source
- Private keys: `-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----`
- `.env` files committed (not in `.gitignore`)
- `NEXT_PUBLIC_` env vars containing secrets (exposed to client)

**Commands:**
```
grep -rn "sk-[a-zA-Z0-9]\{20,\}" src/ 2>/dev/null
grep -rn "AKIA[A-Z0-9]\{16\}" src/ 2>/dev/null
grep -rn "apiKey\|api_key\|API_KEY" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "process\.env\|\.env" | head -20
grep -rn "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*KEY\|NEXT_PUBLIC_.*TOKEN" .env* 2>/dev/null
grep -rn "BEGIN.*PRIVATE KEY" src/ 2>/dev/null
git ls-files | grep -E "\.env($|\.)" 2>/dev/null
```

**Finding IDs:** RT-501 … RT-599.
**Severity:** CRITICAL for exposed private keys or API secrets, HIGH for committed `.env`, MEDIUM for `NEXT_PUBLIC_` secrets.

## Persona 6 — Config Auditor (`config-auditor`) [RT-6xx]

**Objective:** Check security headers, CORS, CSP, cookie configuration.

**Tooling:** grep, regex over config files. No reasoning.

**Procedure:**
1. Grep `next.config.js`/`next.config.mjs` for security header declarations.
2. Grep middleware for security header injection.
3. Regex-verify CORS configuration on API routes.
4. Grep cookie settings for `httpOnly`, `secure`, `sameSite`.
5. Regex-verify CSP is configured and not overly permissive.

**Detection patterns (regex only):**
- Missing security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`
- Missing or permissive CSP (`unsafe-inline`, `unsafe-eval`, `*` sources)
- CORS allowing `*` origin or reflecting request origin without validation
- Cookies missing `httpOnly`, `secure`, or `sameSite` flags
- `Access-Control-Allow-Credentials: true` with permissive origins
- Missing `X-XSS-Protection` header (legacy but defense-in-depth)
- `powered-by` header not stripped

**Commands:**
```
grep -rn "headers\|securityHeaders\|Content-Security-Policy" next.config* 2>/dev/null
grep -rn "X-Frame-Options\|X-Content-Type-Options\|Strict-Transport-Security" src/ 2>/dev/null
grep -rn "Access-Control-Allow-Origin" src/app/api/ 2>/dev/null
grep -rn "httpOnly\|secure\|sameSite" src/ 2>/dev/null
grep -rn "setCookie\|cookies().set\|cookies.set" src/ 2>/dev/null
```

**Finding IDs:** RT-601 … RT-699.
**Severity:** HIGH for missing CSP or permissive CORS, MEDIUM for missing security headers, LOW for missing legacy headers.

## Output

Return ONLY this JSON shape — no prose, no markdown:

```json
{
  "scan_type": "quick",
  "target_scope": "full-stack",
  "files_checked": 0,
  "findings": [
    {
      "id": "RT-101",
      "persona": "dependency-auditor",
      "severity": "CRITICAL",
      "category": "OWASP A06:2021 — Vulnerable and Outdated Components",
      "file": "package.json",
      "line": 42,
      "description": "what was found",
      "impact": "what an attacker could do",
      "mitigation": "how to fix"
    }
  ],
  "clean_personas": [],
  "summary": "X critical, Y high, Z medium, W low"
}
```

Rules: read-only; return JSON only; every finding needs `file` + `line` + `impact` + `mitigation`; clean personas (those with zero findings) listed in `clean_personas`.
