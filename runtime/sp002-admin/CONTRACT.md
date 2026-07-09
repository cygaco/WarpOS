# SP-20260614-002 admin:* suite — FROZEN BUILD CONTRACT (the integration seam)

Authored by α (ε face) from the product-lead AC + director-of-engineering architecture + β's two DECIDE consults. **All three builders below build against THIS doc in parallel.** Do not renegotiate the contract; if something is genuinely underspecified, pick the simplest choice that satisfies the cited AC and note it in your return.

Layer = **dev-tooling** (skills under `.claude/commands/admin/` + node under `scripts/admin/` + a `framework/` registry + a `scripts/checks/` enforcer). NOT product code. Run-in-product: every opener targets a PRODUCT's Next app, **never WarpOS itself**.

## A. The instance pointer (single-writer seam) — `.claude/runtime/admin-preview.json`

Shape (`$schema: "warpos/admin-preview/v1"`):
```json
{ "$schema":"warpos/admin-preview/v1", "instanceDir":"<abs path>", "slug":"admin-preview-instance",
  "port":3000, "pid":12345, "url":"http://localhost:3000", "route":"/admin", "startedAt":"<ISO>", "startedBy":"admin:preview" }
```
- **`scripts/admin/preview.js` is the SOLE writer** of this file (mode-set.js chokepoint pattern: atomic tmp+rename). NO other file in `scripts/admin/*` may write it. `seed.js` READS it only.
- Lives under `.claude/runtime/` (walk-skipped → no BC-02 honesty drift).

## B. `scripts/admin/preview.js` — the keystone (Builder 1) · AC-R1a/b/c, AC-R6a, AC-R3c(writer)

CLI: `node scripts/admin/preview.js [--route <subroute>] [--scaffold] [--force] [--instance-dir <dir>] [--json]`
- Default route `/admin`. `--route /admin/readiness` opens that sub-route. `--instance-dir` overrides the default throwaway dir.
- Default throwaway instance dir = `runtime/admin-preview/instance/` (repo-root-relative, walk-skipped). Fixed/single instance.

Flow (in order):
1. **`refuseIfTargetIsWarpOS(targetDir)` FIRST** — refuse (non-zero exit, no side effects) if the resolved target is the WarpOS canonical root. Detect via: `path.resolve(targetDir) === WARPOS_ROOT` OR target's `.claude/manifest.json` has a top-level `warpos:` block OR `project.slug === "warpos"`. Do NOT use `getWarpProduct()` (false-positives a product named "warpos"). [AC-R1c]
2. **Resolve-or-scaffold (reuse-default):** if `<dir>/package.json` exists and not `--force` → REUSE (no re-scaffold, no second npm install). Else scaffold via `scaffoldProductApp({ repoRoot:dir, slug:"admin-preview-instance", install:false, log })` from `scripts/portfolio/new-lib.js` (returns `{ok,alreadyPresent,created,error}` — branch on `.ok`, never throw). Before a cold scaffold, print an **upfront ETA banner** ("scaffolding a throwaway instance, ~30-90s incl. npm install; reused on later runs"). [AC-R1a/b]
3. **ensureDeps:** if `node_modules` absent → `npm install` (shell:true on win32), fail-CLEAR + non-zero on install failure (name the dir + remediation). [AC-R1c]
4. **Start dev + poll-for-ready + parse port:** `spawn("npm",["run","dev"],{cwd:dir, stdio:["ignore","pipe","pipe"], shell:win32})`, NOT detached. Tee child stdout/stderr to our stdout. Poll the captured buffer for the ready line (regex must match Next's variants: `/started server on|Ready in|- Local:\s*https?:\/\/|ready on|compiled/i`) AND **parse the actual port** from a `https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):(\d+)` match (Next self-heals a busy port by choosing the next free one + printing it — never hardcode 3000). Open the browser **only after** ready+port. Hard timeout (90s) → kill child + fail-CLEAR ("dev server not ready… port busy/build error"), non-zero, NO browser open. Never orphan the child (kill on timeout/exit). [AC-R1a/c]
5. On ready: **write the pointer** (sole writer, atomic), then `openInBrowser(`http://localhost:${port}${route}`)` — **lift `openInBrowser` VERBATIM from `scripts/dispatch/gui.js:43-59`** (win32 `cmd /c start "" url` / darwin `open` / xdg-open, `.unref()`, try/catch). [AC-R1b]
6. **Emit the preview URL** in a stable machine-readable form: print a line exactly `PREVIEW_URL=http://localhost:<port>/admin` so the design-quality/visual-review Playwright lane can grep it. [AC-R6a]
7. Reuse-warm path stays foreground (dev server runs until Ctrl-C); that is acceptable for a preview tool.

`preview.md` skill frontmatter: `description`, `user-invocable: true`, `namespace: admin`, `reads: [scripts/admin/preview.js, framework/admin-panel-registry.json]`, `writes: [.claude/runtime/admin-preview.json, runtime/admin-preview/instance/**]`. Body documents the Playwright-lane handoff + the run-in-product (never-WarpOS) boundary.

**β rider (gauntlet-binding):** the ready-line matcher test must assert against a **captured REAL `npm run dev` boot log** (a fixture you capture by scaffolding the instance + booting once, OR — if npm install is too slow in this env — a real Next boot banner you cite from Next.js, saved as `tests/regression/SP-20260614-002/fixtures/next-boot-real.log`), NOT only a synthetic string. A green parser test over a synthetic stdout proves parsing, not that the regex fires in prod.

## C. Builder 2 — openers + seed · AC-R2a/b, AC-R3a/b/c

- `.claude/commands/admin/readiness.md` + `guides.md`: **thin one-row delegators** — body shells `node scripts/admin/preview.js --route /admin/readiness` (resp. `/admin/guides`). ZERO duplicated boot/scaffold logic (a copy of harness logic FAILS AC-R2a). Same frontmatter shape as preview.md (`namespace: admin`).
- `.claude/commands/admin/seed.md` + `scripts/admin/seed.js`: `seed.js` **READS** the pointer (`.claude/runtime/admin-preview.json`) to discover `instanceDir`, then seeds INTO that instance only — a founder-allowlist session cookie/marker + sample events + a `FOUNDERS_CHECKLIST.md` (reuse `scripts/scaffold/founders-checklist.js#renderFoundersChecklist` if present) — so the panel renders warm-start. **`seed.js` NEVER writes the pointer.** No live pointer → fail-CLEAR ("run /admin:preview first"). Idempotent (run twice = no dup). Apply the same WarpOS-refusal to the seed target. [AC-R3a/b]
- **`single-writer-invariant` test (AC-R3c):** a static test asserting exactly ONE writer of the pointer across `scripts/admin/*` (grep for writes to the pointer path; only preview.js may). This test runs post-integration (needs both files) — author it, mark it the cross-file invariant.

## D. Builder 3 — registry + source path keys + enforcer · AC-R4a/b/c, AC-R5a

- `framework/admin-panel-registry.json` — generic `panels` map so item-23 `/panel:*` can read the SAME file (alias-beside, never fork):
```json
{ "$schema":"warpos/admin-panel-registry/v1", "panels": {
  "admin":     {"route":"/admin","opener":"node scripts/admin/preview.js","description":"Founder admin home"},
  "readiness": {"route":"/admin/readiness","opener":"node scripts/admin/preview.js --route /admin/readiness","description":"Launch-readiness sub-route"},
  "guides":    {"route":"/admin/guides","opener":"node scripts/admin/preview.js --route /admin/guides","description":"Founder guides sub-route"} } }
```
- **SOURCE path keys** — add to `framework/paths.registry.json` (NOT the generated `.claude/paths.json`): `scriptsAdmin` → `"scripts/admin"` (kind dir, owner framework), `adminPanelRegistry` → `"framework/admin-panel-registry.json"` (kind json, owner framework). Then run `node scripts/paths/build.js` and **VERIFY both keys appear** in `.claude/paths.json` AND `scripts/hooks/lib/paths.generated.js` (AC-R4a — the orphan-bug guard). Mirror the existing `hooks` entry shape (paths.registry.json:186).
- `scripts/checks/admin-suite-coverage.js` — **fail-CLOSED** enforcer (mirror `scripts/checks/skill-hook-coverage.js`): asserts (i) each admin skill resolves via `node scripts/dispatch-skill.js --resolve --skill admin:<name>` (found:true), (ii) every registry `panels` row's opener resolves to a real script/skill (no orphan/phantom), (iii) `scripts/admin/preview.js` source contains the `refuseIfTargetIsWarpOS` assertion. Non-zero on any failure. Wire **REPORT-ONLY** into `/scan:full` (find where skill-hook-coverage is registered + add alongside). [AC-R5a]
- AC-R4c (registry cross-provider review) + AC-R5b (maps + BOTH manifests regen) are **α-owned post-integration steps**, NOT yours — do not run manifest regen inside a worktree.

## E. Tests — all under `tests/regression/SP-20260614-002/` (the `verified_by` paths in acceptance-criteria.md)
Each builder ships the tests whose AC it makes true (node assertions; seam-inject the scaffold/dev-server — NO real `npm run dev` in the corpus except the β-rider real-boot-log fixture). Test files named exactly per the `verified_by` lines: `preview-boot-detection.test.js`, `preview-reuse-default.test.js`, `preview-failclear.test.js`, `preview-emits-url.test.js`, `openers-delegate.test.js`, `seed-reads-pointer.test.js`, `seed-idempotent.test.js`, `single-writer-invariant.test.js`, `pathkey-roundtrip.test.js`, `registry-shape.test.js`, `admin-suite-coverage.test.js`.

## Hard rules for all builders
- Build ONLY your scoped files. Do NOT `git add -A`. Do NOT edit `.claude/paths.json` by hand (it is generated). Do NOT run manifest regen. Return a lean envelope: the files you created/edited + test pass/fail counts + any contract ambiguity you resolved.
