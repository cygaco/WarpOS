# WARPOS.md — upstream framework gap register

> The durable channel that carries **framework/tooling-layer gaps** to WarpOS canonical so
> they get fixed once, for everyone. Produced by `/warp:flag`; consumed by `/warp:reconcile`.
> WarpOS sync is one-way (canonical → product); this register is how the *gap* travels upstream.
>
> Installed WarpOS version: **0.14.0** (source: `.claude/framework-installed.json#installedVersion`).
> This file lives in canonical itself — entries here are self-flagged framework capability gaps
> discovered while building the framework.

**Severity legend:** `H` blocks a subsystem/command · `M` friction / partial failure · `L` polish / latent.
**Status legend:** Local = state in THIS repo (`fixed-local`/`open`/`worked-around`) · Upstream = state in canonical (`open`/`escalated`/`fixed-canonical`).

## Summary

| ID | Severity | Subsystem | Symptom | Local | Upstream |
|---|---|---|---|---|---|
| WG-1 | M | scaffold | `bootstrap:spinup --where android\|ios\|desktop-*` scaffolds the web/PWA baseline only — no native scaffold | worked-around | open |

---

## WG-1 — No native app scaffold for `--where android|ios|desktop-pc|desktop-mac`

- **Layer:** framework (`scripts/scaffold/app.js` + the `bootstrap:spinup` `setup` step).
- **ID:** WG-1
- **Severity:** M
- **Subsystem:** scaffold
- **Symptom:** `bootstrap:spinup` accepts `--where android|ios|web|desktop-pc|desktop-mac` (WARPOS-PROMPT §3), but `scripts/scaffold/app.js` only knows the Next.js + Tailwind v4 + shadcn/ui web baseline. For a native target the `setup` step scaffolds the **web/PWA baseline**, records the requested target honestly in the brief + `data.platform`, and logs a note — but there is no native (React Native / Expo / Tauri / Electron) scaffold. A web app is never presented as native (verify-before-claim holds).
- **Root cause:** `scripts/scaffold/app.js` — no platform-conditional scaffold path; `scaffoldApp()` emits the web baseline unconditionally. The `setup` step (`scripts/bootstrap/phases/setup.js` `resolvePlatform` / `NATIVE_PLATFORMS`) records the target and routes all targets to the web baseline by design (v1).
- **Local status:** worked-around — web/PWA baseline for all targets, target recorded honestly, native-packaging epic added to ROADMAP (`E-NATIVE-PACKAGING-001`).
- **Upstream status:** open.
- **Recommended upstream fix:** add platform-conditional scaffolds to `scripts/scaffold/app.js` — Expo/React Native for `android|ios`, Tauri (or Electron) for `desktop-pc|desktop-mac` — gated by `--where`, with the `setup` step selecting the scaffold by platform. Until then the web/PWA baseline + native-packaging epic is the honest v1.
- **Verify-in-canonical hint:** `grep -n "NATIVE_PLATFORMS\|platform" scripts/scaffold/app.js` — if `scaffoldApp` still emits only the web baseline regardless of platform, the gap REPRODUCES. `node scripts/bootstrap/spinup-orchestrate.js setup --where ios --name X --what Y --who Z --repo-root <tmp> --json` shows `data.platform: "ios"` with the web scaffold (recorded, not native).
