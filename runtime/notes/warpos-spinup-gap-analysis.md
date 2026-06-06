# §0 Gap Analysis — current `bootstrap:spinup` behaviors → target steps

> WARPOS-PROMPT.md §0. Read end-to-end: `spinup-orchestrate.js` + `phases/{preflight,intent,canon,roadmap,onscreen}.js` + `test-spinup-orchestrate.js` + `spinup.md` + `canon/generate.js` + `checks/canon-no-unfilled-tokens.js` + `portfolio/new.js`.
> **Target steps** (positional subcommands): `setup` · `canon` · `roadmap` · `paint`. Fold `preflight`+`intent`→`setup`; `onscreen`→`paint`.
> **Rule:** every current behavior maps to exactly ONE step. A silently dropped behavior is itself a regression.

| # | Current behavior | Source (file) | → Step | Notes / change |
|---|---|---|---|---|
| 1 | preflight `/scan:install` gate (refuse gappy install) | `phases/preflight.js` | **setup** | setup = create+scaffold+seed+**preflight**; gate runs inside setup |
| 2 | DEV_SETUP guide-anchor (`anchor:spinup:preflight`) | `spinup.md` | **setup** | re-anchor `spinup:preflight` → `spinup:setup` (update `/guides:integrate` anchor) |
| 3 | research-tier resolution (`resolveResearch`, `RESEARCH_TIERS`, `normalizeResearchMode`) | `spinup-orchestrate.js` | **canon** | KEEP tier→mode; **REMOVE** `off`/`light` (§2) — floor = `simple` |
| 4 | canon `needs_orchestration` handoff | `phases/canon.js` (currently returns `done`) | **canon** | canon now ALWAYS hands off to AI synthesis → `needs_orchestration` (§1/§2) unless already-synthesized + gate-clean on `--resume` |
| 5 | bounded research + `sources[]` β-directive | `canon/generate.js`, `research.js`, `schemas/canon/research-fields.schema.json` | **canon** | unchanged engine; canon step drives it; `--research-in <fixture>` for deterministic tests (§7) |
| 6 | `canon-no-unfilled-tokens` enforcer | `checks/canon-no-unfilled-tokens.js` | **canon** | wire as **fail-closed, non-opt-out completion gate** (§2) — currently NOT wired into the phase |
| 7 | scaffold-if-missing (S0.3) | `phases/onscreen.js`, `portfolio/new.js`, `scaffold/app.js` | **setup** (primary) + **paint** (idempotent safety net) | setup scaffolds; paint keeps the no-op-if-present net |
| 8 | `verifyServe` gate (build + HTTP 200 + entry transforms) | `phases/onscreen.js` | **paint** | unchanged; pure+injectable; "builds≠serves" |
| 9 | visual-review BAIL-when-no-Playwright | `spinup.md` | **paint** | unchanged note |
| 10 | design-library pointer | `spinup.md` | **paint** | unchanged note |
| 11 | `.warpos/spinup-state.json` persistence | `spinup-orchestrate.js` (`loadState`/`saveState`/`stateFile`) | **driver** | extend schema to 4-step; `completed[]` keyed by new step names |
| 12 | `--phase`/`--resume` | `spinup-orchestrate.js` | **driver** | `--phase` → positional `<step>` subcommand; `--resume` kept |
| 13 | `--repo-root <path>` | `spinup-orchestrate.js` | **driver** | unchanged (all steps) |
| 14 | `--json` status | `spinup-orchestrate.js` | **driver** | stabilize shape: `{ phase, status (ok\|needs_orchestration\|failed), ran[], orchestration_prompt, data{serveUrl,firstAction,roadmapPath} }` |
| 15 | fixture e2e | `test-spinup-orchestrate.js` | **enforcers** | rewrite per-step seam test (§7) |
| 16 | intent `--clone <target>` mode (reuse `clone.js`) | `phases/intent.js` | **setup** | `--clone` = MODIFIER on setup; clone doc kept under `_docs/clones/<slug>/` |
| 17 | intent guided-brief / `--intent` accept | `phases/intent.js` | **setup** | raw intake → INTENT/brief artifact ONLY; never canon (§2) |
| 18 | brief-reuse (G4.6 `findExistingBrief`) | `phases/intent.js` | **setup** | unchanged reuse logic |
| 19 | research default = `simple` (Moderate) everywhere | `spinup-orchestrate.js` (`DEFAULT_RESEARCH`) | **canon** | KEEP `simple` as floor/default |
| 20 | `--research off` / `light`→off alias | `spinup-orchestrate.js` | **REMOVED** | reject non-zero (§2); delete `off` from `RESEARCH_TIERS`, `normalizeResearchMode`, validators |
| 21 | `--auto` degrade/skip paths (thin roadmap render; bare-scaffold "serve") | `phases/roadmap.js` (`renderAutomaticRoadmap`,`writeCurrentSprint`), `phases/onscreen.js` auto block | **REMOVED** | §2 forbids any `--auto`/`--fast`/skip that bypasses synthesis or the gate; consumer contract (`needs_orchestration`→fulfill→`--resume`) replaces it |
| 22 | EXPECTED_ARTIFACTS derived from engine doc lists | `phases/canon.js` (`NARRATIVE`+`STRUCTURED`) | **canon** | unchanged (rot-proof) |
| 23 | canon engine reuse (`generate.js`) | `phases/canon.js` | **canon** | generate = structural scaffold ONLY (valid shape, zero raw `{{tokens}}`); never ships as "done" (§2) |
| 24 | roadmap scaffold seed (`generate-roadmap-scaffold.js`) | `phases/roadmap.js` | **roadmap** | deterministic seed kept; grounded synthesis → `roadmap:create` via `needs_orchestration` |
| 25 | `isGroundedRoadmap` short-circuit (ledger anchor + Milestones) | `phases/roadmap.js` | **roadmap** | "Milestones" → "Epics" (§5) |
| 26 | `writeCurrentSprint` (auto path) | `phases/roadmap.js` | **REMOVED** | tied to `--auto` (#21) |
| 27 | portfolio:new create + scaffold + register | `portfolio/new.js` | **setup** | §4: split into `create()`/`scaffold()` callables; setup reuses; new.js = setup composed |
| 28 | machine-readable `orchestration_prompt` at LLM steps | all phases | **canon/roadmap/paint** | consumer contract (§1) |
| 29 | exit codes (0/1/3/2) | `spinup-orchestrate.js` | **driver** | keep; map to `status` field in `--json` |
| 30 | `--product`/`--intent`/`--out`/`--state`/`--dry-run` | `spinup-orchestrate.js` | **driver** | kept |
| 31 | NEW: `--name`/`--what`/`--who` raw intake | — (NEW §1) | **setup** | structured-arg intake → brief (raw→intent) |
| 32 | NEW: `--where android\|ios\|web\|desktop-pc\|desktop-mac` | — (NEW §3) | **setup** (scaffold) + **canon** (PRODUCT_MODEL) + **roadmap** (influence) | v1: web/PWA baseline for all targets; record honestly; native-packaging epic + `/warp:flag` |

## Net step definitions (target)

- **setup** — DETERMINISTIC (no LLM): sibling repo + `git init` + WarpOS install + platform-aware app scaffold + register + capture raw intake (`--name/--what/--who/--where`, or `--clone` competitor intel) into the INTENT/brief artifact ONLY. Runs preflight `/scan:install` gate. Reuses `portfolio:new`'s `create()/scaffold()`. Start→finish, idempotent.
- **canon** — AI SYNTHESIS (anti-degrade): generate.js renders the structural scaffold; canon returns `needs_orchestration` for AI to synthesize every thin/substantive field; on `--resume` runs `canon-no-unfilled-tokens` as a fail-closed, non-opt-out gate. NO path to degraded canon.
- **roadmap** — AI: seed scaffold deterministically, then `roadmap:create` (Epics + sprints, core-loop first) via `needs_orchestration`; `--resume` accepts a grounded ROADMAP.md (Epics + `<!-- ledger:sprints -->`).
- **paint** — AI: execute Epic 1's first sprint until the core loop SERVES, gated by `verifyServe`. Scaffold-if-missing net, visual-review opt-in/BAIL, design pointer preserved.

## Dropped-behavior check
Zero behaviors dropped. Two behaviors **intentionally removed** per §2 anti-degrade (not dropped — replaced): `--research off`/`light` (→ rejected) and `--auto` degrade/skip paths (→ consumer contract). Every other behavior maps to exactly one step above.
