# E-MC-READINESS Track-2 — Security Hardening Pass (Master Console External Launch)

**Type:** READ-ONLY adversarial security findings · analysis only, no code changed.
**Date:** 2026-06-16 · **Scope:** WarpOS shipped/launch-relevant security surface for the Master Console external launch.
**Method:** attacker + careless-founder threat model; per surface name concrete attack → control-present? → sufficient? → severity + exploitability. Verify-don't-inherit: cross-checked against the prior S-PF-01/S-PF-03 cross-provider security reviews (both PASS) and re-derived against current code on disk.

---

## 1. TL;DR

**14 findings. 0 critical, 2 high, 5 medium, 7 low/clean-bill.**

**Launch-readiness security verdict: CONDITIONALLY READY.** The two most attacker-exposed surfaces of an external launch — the founder admin gate and the dispatch/secrets substrate — are genuinely well-hardened and carry live enforcers (a real scaffold-coverage test with planted-bypass fixtures; safe-spawn with multiple GPT-5.5 review passes baked in; a fail-closed brand-leak scanner). No reachable auth bypass, cookie-forgery, command-injection, or IDOR-with-blast-radius was found in the shipped code.

The blockers are not in what WarpOS *wrote* — they are in two **gaps the founder is silently left to fill**, and one **trust-boundary on the update channel**:

1. **(HIGH) The signed admin session has no expiry, no rotation, and no revocation.** A leaked cookie value is a permanent skeleton key.
2. **(HIGH) No login / set-cookie path ships, and nothing enforces the cookie's security attributes.** A careless founder wiring their own `cookies().set()` will very plausibly omit `HttpOnly`/`Secure`/`SameSite` — and no enforcer catches it (the existing enforcer only checks the *verify* path, not an *issue* path that doesn't exist yet).
3. **(MED, conditionally HIGH) The update channel runs capsule-controlled `node <script>` commands; checksums verify integrity, not provenance.** A malicious or MITM'd capsule = RCE on `--apply`.

Everything else is medium/low or an explicit clean bill (noted below — a clean bill matters for a launch gate).

---

## 2. Findings Table

| # | Surface | Attack scenario | Control present? | Sufficient? | Severity | Exploitability (external user reachable?) | Fix |
|---|---------|-----------------|------------------|-------------|----------|-------------------------------------------|-----|
| F1 | Admin session cookie | Steal/exfil the `warpos_admin_session` cookie value (XSS-on-another-app, log leak, shoulder-surf) → reuse forever; no TTL in the signed token (`config.ts.tmpl:61-94` signs only `email`, no `iat/exp/nonce`) | Partial — HMAC-SHA256 + `timingSafeEqual` + allowlist | **No** — token never expires, can't be revoked, secret rotation is the only kill-switch (logs everyone out) | **High** | Yes, *if* a token leaks (the cookie is the entire credential) | Add `exp` + `iat` to the signed payload; verify freshness; add a per-founder `tokenVersion` so rotation can target one account. Set a `Max-Age` on the cookie. |
| F2 | Admin login / cookie issuance | No login route or `cookies().set()` ships anywhere in the scaffold (`signAdminSessionEmail` is exported but **never called** — grep: 1 hit, the definition). Founder hand-rolls issuance → omits `HttpOnly`/`Secure`/`SameSite=Lax`/`Path` | **No** issuance code; **no enforcer** on issuance attributes (the S-PF-03 test only checks the *verify* path uses `cookies()` not `headers()`) | **No** | **High** | Yes — a cookie set without `HttpOnly` is JS-readable → F1 leak becomes trivial; without `Secure` it crosses HTTP | Ship a reference login route (or a documented `setAdminSession()` helper) that sets `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=…`, and extend `scaffold-coverage-scan.js` to assert those flags on the issuance helper. |
| F3 | Update channel (capsule) | Malicious or MITM'd capsule: `release.json#postUpdateChecks` / generators run `node <scriptRel> [args]` (`update.js:839`, `:890`) and `migrations` execute arbitrary JS in `targetRoot` on `--apply`. `checksums.json` verifies internal consistency (`update.js:181-205`), **not** a signature/provenance | Partial — checksum integrity check; Class-C escalation; transactional rollback (`transaction.js`) | **No** for provenance — a self-consistent hostile capsule passes all gates and runs as the operator | **Medium** (conditionally **High**) | Not a *web* user. Reachable by anyone who can place a capsule in the source tree / sibling `../WarpOS` clone / MITM the source. For a *closed local engine* (the Master Console model) the source is trusted → exploitability stays Medium | Sign capsules (detached signature over `checksums.json`) and verify the signature before apply; pin the canonical source; treat `postUpdateChecks` script paths as an allowlist, reject `..`/absolute. |
| F4 | post-update check / generator path | `scriptRel` from the capsule is `path.join(targetRoot, scriptRel)` with only `fs.existsSync` gating (`update.js:828-831`) — a `../`-shaped path traverses out of the repo if such a file exists | No path-traversal guard on `scriptRel` | **No** (defense-in-depth gap; subordinate to F3's trust boundary) | **Low** | Same reach as F3 (capsule-controlled) | Reject `scriptRel` containing `..` or that resolves outside `targetRoot`; only run repo-relative scripts. |
| F5 | Secrets in `.env` | Founder puts `ADMIN_SESSION_SECRET`/API keys in a plain `.env` or `.env.production` and commits it — the managed gitignore block ignores only `.env*.local` (`scaffold/app.js:60`) | Partial — `.env*.local` IS gitignored (idempotent `ensureGitignore`, always runs) | **Mostly** — closes the common `.env.local` case; a non-`.local` env file is still trackable | **Medium** | Indirect (founder self-inflicts a public secret commit) | Broaden the managed block to `.env`, `.env.*`, with a `!.env*.example` negation; the `.env.local.example` comment already *claims* "`.env*` is gitignored" — make the claim true. |
| F6 | Admin entitlement / state mutation | Forge `userId`/`entitlement`/`state` in the server-action FormData to escalate another user or grant arbitrary entitlement (IDOR / mass-assignment) | **Yes** — `requireFounderAdmin()` on every action (`actions.ts.tmpl:23,40,58`); `isAdminEntitlement()` allowlist; `state` enum-checked; audit record on every mutation | **Yes** | **Low** | No (gated; allowlisted) | **Clean bill.** Enforced by `admin-surface.test.js` planted-bypass fixtures (`unguarded-admin-actions`, `arbitrary-entitlement`). |
| F7 | Readiness write-back authz | Relabel a `sprint-work`/`waiver` gate as `owner-action` in client form input to force a phantom `FOUNDERS_CHECKLIST.md` patch | **Yes** — `owner_class` is derived **server-side** from the producer, never trusted from the client (`readiness/actions.ts.tmpl:33-84`); fail-closed to reject | **Yes** | **Low** | No | **Clean bill.** Explicit server-side authz derivation is the right pattern. |
| F8 | Guide viewer path traversal | `GET /admin/guides/../../etc/passwd` or `../../DEV_SETUP_GUIDE.md` to read arbitrary files | **Yes** — rejects any `..`/separator *before* allowlist; requires registry-membership; no disk read for non-allowlisted ref; renders as escaped `<pre>` (no `dangerouslySetInnerHTML`) (`guides/[ref]/page.tsx.tmpl:54-105`) | **Yes** | **Low** | No (founder-gated *and* traversal-hardened) | **Clean bill.** Strong layered defense. |
| F9 | Dispatch command injection | Inject shell metachars / a model-chosen exe path / a `.cmd`-shim weaponization through a dispatched agent's argv | **Yes** — `safe-spawn.js` arg-allowlist per tool, `INJECT_META` on every arg *and* consumed flag value, PATH-hijack guard (repo/temp/realpath), System32-pinned `cmd.exe`/`taskkill`, `shell:false`, tree-kill | **Yes** | **Low** | No | **Clean bill.** Multiple GPT-5.5 review passes are encoded as comments + code (CVE-2024-27980 residuals addressed). |
| F10 | Secret-to-remote / key in logs | A dispatched provider call logs the API key, or a `.env` value like `KEY=$(rm -rf …)` executes on load | **Yes** — `auth-resolver.js` in-code dotenv (never a shell), label-only report API, `withValue` never logged, `$(`/backtick values flagged `suspicious` and refused, BOM-safe | **Yes** | **Low** | No | **Clean bill.** The shell-injection-on-env-load vector (§16.2) is closed at the source. |
| F11 | providers.js legacy fallback | Force the legacy `shell:true` spawn path (the "lib-only fix bypass" bug class) by making the safety kernel unloadable | **Yes** — fail-**closed**: if `safe-spawn` can't load, `runProvider` throws rather than shelling out (`providers.js:843-849`); a manifest-overridden provider with no ARG_POLICY also fails closed (`:766-774`) | **Yes** | **Low** | No | **Clean bill.** Correctly refuses to re-introduce the injection surface. |
| F12 | Shape-door (just-landed) | Smuggle a build-chain worker into an in-process shape, or run an unproven subprocess, past the new shape gate | **Yes** — `dispatch-shape.js` fail-OPEN on resolver fault (never breaks a dispatch) but enforce-mode REFUSES high-severity mismatches (`shapeDoor`); unproven subprocess + build-chain-in-process are the two `severity:high` cases | **Yes (for its purpose)** | **Low** | No (internal dispatch governance, not an external surface) | **Clean bill** as a governance control. Note it is a *correctness/cost* guard, not an authz boundary — don't over-credit it as security. |
| F13 | Brand boundary leak | "WarpOS" or the `warpos/readiness/v1` schema id leaks into the product-facing DOM a founder sees | **Yes** — `brand-leak-scan.js` is **fail-closed** (missing/unreadable dir or `scanned:0` = hard FAIL, not vacuous pass), case-insensitive, strips machine-layer wiring, scans the visible surface | **Yes (for the shipped surface)** | **Low** | N/A (brand/trust, not a vuln) | **Clean bill.** Residual: scope is the readiness panel + guide content only; widen as more product-facing surfaces ship. |
| F14 | Admin store persistence | (Correctness, surfaced during the security pass) entitlement/account-state mutations write to module-level in-memory arrays (`store.ts.tmpl:46-116`) — lost on restart, not a real DB | N/A (demo seam) | N/A | **Low** (info) | No | Not a vuln; reduces IDOR blast radius today. Before real users, back it with a persistent store + row-level authz — at which point F1/F2 become more load-bearing. |

---

## 3. Top-5 Must-Fix Before External Launch

1. **F1 — Add expiry + revocation to the admin session token.** Sign `{email, iat, exp, tokenVersion}` and verify freshness; set cookie `Max-Age`. Today a single leaked cookie is a permanent, un-revocable founder credential. *(High; one-file change in `config.ts.tmpl`.)*

2. **F2 — Ship (and enforce) a secure cookie-issuance path.** Provide a reference `setAdminSession()` / login route that sets `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age`, and extend `scaffold-coverage-scan.js` to assert those flags. Right now the founder is left to hand-roll issuance with zero guardrail — the single most likely place a careless founder introduces an XSS-readable, cross-HTTP session. *(High.)*

3. **F3 — Establish capsule provenance for the update channel.** Sign capsules and verify the signature before `--apply`; pin the canonical source. Checksums prove a capsule wasn't *corrupted*, not that it isn't *hostile*. For the closed-engine model this is the trust root of the whole distribution. *(Med→High; pairs with F4's traversal guard.)*

4. **F5 — Make the gitignore claim true.** Broaden the managed block to ignore `.env`/`.env.*` (with `!.env*.example`). The example file already promises "`.env*` is gitignored"; a founder who follows convention and uses `.env.production` for `ADMIN_SESSION_SECRET` currently commits it. *(Med; trivial.)*

5. **F4 — Path-traversal-guard the post-update script runner.** Reject capsule `postUpdateChecks` paths containing `..` or resolving outside `targetRoot`. Defense-in-depth behind F3; cheap and removes the traversal primitive entirely. *(Low individually, but it's the cheap half of the F3 pair.)*

---

## 4. Notes on Sufficiency (the clean bills)

The following controls were adversarially probed and found **sufficient for the launch gate** — recorded explicitly because a clean bill is itself a gate output:

- **Founder authz on mutations (F6) and readiness write-back (F7)** — server-side allowlists and server-derived `owner_class`; no client-trusted authorization. Backed by planted-bypass fixtures in `tests/regression/S-PF-03/admin-surface.test.js`.
- **Guide viewer (F8)** — traversal rejected before allowlist, registry-membership required, output escaped.
- **The dispatch substrate (F9/F10/F11)** — `safe-spawn.js` + `auth-resolver.js` are the strongest code in this review; the shell-injection, PATH-hijack, key-leak, and lib-only-bypass classes are all closed, fail-closed, and commented with their review provenance.
- **Brand boundary (F13)** — fail-closed scanner; the false-green class WarpOS repeatedly hardens against is handled (`scanned:0` = FAIL).
- **The dev-env bypass** correctly fails closed in production (`NODE_ENV !== "production"` → `devEmail=""`, `config.ts.tmpl:101-104`), enforced by the `production-dev-email-fallback` fixture.

The net: WarpOS's *written* security surface is launch-grade. The launch risk is concentrated in the **handoff to the founder** (session lifecycle + cookie issuance they must complete) and the **update channel's trust root** (provenance, not just integrity). Fix the top-5 and the external-launch security posture is sound.

---

### Evidence index (file:line)
- Founder gate / cookie: `framework/templates/app-scaffold/src/lib/admin/config.ts.tmpl:42-119`
- Admin mutations + authz: `framework/templates/app-scaffold/src/app/admin/actions.ts.tmpl:22-69`
- Readiness server-side authz: `framework/templates/app-scaffold/src/app/admin/readiness/actions.ts.tmpl:33-95`
- Guide viewer traversal guard: `framework/templates/app-scaffold/src/app/admin/guides/[ref]/page.tsx.tmpl:54-105`
- In-memory store: `framework/templates/app-scaffold/src/lib/admin/store.ts.tmpl:46-146`
- Secret guard hook: `scripts/hooks/secret-guard.js` (wired `.claude/settings.json:87`)
- Auth resolver: `scripts/dispatch/auth-resolver.js:54-269`
- Safe-spawn kernel: `scripts/dispatch/safe-spawn.js:100-457`
- Shape-door: `scripts/dispatch/dispatch-shape.js:257-321`
- Update apply / capsule exec: `scripts/warpos/update.js:181-205, 810-902`
- Transaction/rollback: `scripts/warpos/transaction.js:198-487`
- Brand-leak scanner: `scripts/checks/brand-leak-scan.js:98-169`
- Managed gitignore block: `scripts/scaffold/app.js:52-66, 118-128`
- Admin enforcer test: `tests/regression/S-PF-03/admin-surface.test.js`
- Prior reviews cross-checked: `runtime/s-pf-03-security-review.out.json` (PASS), `runtime/s-pf-01-review-security.md`
