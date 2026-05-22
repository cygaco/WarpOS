#!/usr/bin/env bash
# One-shot ticket minter for SP-20260520-001 (product:clone, 14 stories)
# and SP-20260520-002 (product:import, 8 stories).
# Idempotency: ticket ids are auto-minted (T-YYYYMMDD-NNN). Re-running mints
# fresh ids. Do NOT re-run unless intentional.
set -e

PRD1=".claude/project/sprint/requirements/SP-20260520-001/prd.md"
PRD2=".claude/project/sprint/requirements/SP-20260520-002/prd.md"
SPRINT_ID=""

mint () {
  node scripts/sprint/ticket.js create --sprint "$SPRINT_ID" "$@" --status ready_for_execution
}

SPRINT_ID="SP-20260520-001"
echo "=== SP-20260520-001 / product:clone tickets (14) ==="

mint --title "CLI surface: parse flags, derive slug, validate input" \
  --type feature --risk low \
  --linked-hl H-1 --linked-story S-1 --linked-prd "$PRD1" \
  --linked-requirements "R-1" \
  --linked-copy "C-1;C-2" \
  --linked-inputs "IN-1;IN-2;IN-3;IN-4;IN-5" \
  --linked-trace "" \
  --linked-ac "AC-1.1;AC-1.2;AC-1.3" \
  --description "/product:clone CLI surface: parse --name, --url, --video, --slug, --output-dir; derive slug from --name when --slug omitted; validate URLs (block file://, internal IPs to prevent SSRF); exit codes per AC-1.1/1.3."

mint --title "WebSearch product identification" \
  --type feature --risk medium \
  --linked-hl H-1 --linked-story S-2 --linked-prd "$PRD1" \
  --linked-requirements "R-2" \
  --linked-copy "C-3" \
  --linked-inputs "IN-1;IN-2;IN-3" \
  --linked-trace "TR-2" \
  --linked-ac "AC-2.1;AC-2.2" \
  --description "Resolve product identity from --name or --video via WebSearch when no --url provided; record resolved_via in TR-2. Skip search when --url present."

mint --title "One-level URL discovery from product website" \
  --type feature --risk medium \
  --linked-hl H-4 --linked-story S-3 --linked-prd "$PRD1" \
  --linked-requirements "R-3;R-11" \
  --linked-copy "C-3;C-7" \
  --linked-inputs "" \
  --linked-trace "TR-3" \
  --linked-ac "AC-3.1;AC-3.2;AC-3.3" \
  --description "Bounded link discovery: same-host only, cap at 8 URLs, prefer pricing/docs/blog/about/features path patterns. Anti-spider guardrail per R-11."

mint --title "Review-source collection (G2, ProductHunt, Reddit, HN, blogs)" \
  --type feature --risk medium \
  --linked-hl H-3 --linked-story S-4 --linked-prd "$PRD1" \
  --linked-requirements "R-4" \
  --linked-copy "C-4" \
  --linked-inputs "IN-6" \
  --linked-trace "TR-4" \
  --linked-ac "AC-4.1;AC-4.2;AC-4.3" \
  --description "WebSearch site: queries against G2/ProductHunt/Reddit/HN/blog domains; collect up to --max-review-sources distinct URLs; single retry on 429 then source_failed event."

mint --title "Source caching for audit" \
  --type feature --risk low \
  --linked-hl H-2 --linked-story S-5 --linked-prd "$PRD1" \
  --linked-requirements "R-5;R-6" \
  --linked-copy "" \
  --linked-inputs "IN-7" \
  --linked-trace "TR-4" \
  --linked-ac "AC-5.1;AC-5.2" \
  --description "Persist every fetched URL to _docs/clones/<slug>/_raw/<sha256>.html + .meta.json (url, retrieved_at, http_status). Reuse cache on re-runs unless --no-cache."

mint --title "JTBD extraction pass" \
  --type feature --risk medium \
  --linked-hl H-1 --linked-story S-6 --linked-prd "$PRD1" \
  --linked-requirements "R-5" \
  --linked-copy "C-5;C-11" \
  --linked-inputs "" \
  --linked-trace "TR-6" \
  --linked-ac "AC-6.1;AC-6.2" \
  --description "LLM pass over aggregated cached pages → 3-5 JTBDs with one-line rationale each. Grounded in retrieved text (no hallucinated JTBDs)."

mint --title "Feature list with build-complexity + core-ness scoring" \
  --type feature --risk medium \
  --linked-hl H-1 --linked-story S-7 --linked-prd "$PRD1" \
  --linked-requirements "R-5;R-6" \
  --linked-copy "C-5" \
  --linked-inputs "" \
  --linked-trace "TR-6" \
  --linked-ac "AC-7.1;AC-7.2;AC-7.3" \
  --description "LLM pass → feature table with build-complexity (S/M/L/XL) and core-ness (1-5). Rubric embedded in prompt; every feature cites a source URL from cached corpus."

mint --title "Voice-of-customer extraction with quote attribution" \
  --type feature --risk high \
  --linked-hl H-2 --linked-story S-8 --linked-prd "$PRD1" \
  --linked-requirements "R-5;R-6" \
  --linked-copy "C-5" \
  --linked-inputs "" \
  --linked-trace "TR-6" \
  --linked-ac "AC-8.1;AC-8.2" \
  --description "LLM extracts user quotes from cached review pages; every quote tagged with source URL + retrieval timestamp. Hallucinated quote = refuse-to-emit. Hardest risk item — see redteam-plan."

mint --title "Gaps extraction" \
  --type feature --risk medium \
  --linked-hl H-1 --linked-story S-9 --linked-prd "$PRD1" \
  --linked-requirements "R-5" \
  --linked-copy "C-5" \
  --linked-inputs "" \
  --linked-trace "TR-6" \
  --linked-ac "AC-9.1;AC-9.2" \
  --description "LLM pass over reviews + posts → 3-7 named gaps with severity score. Cite source URLs from cache."

mint --title "Opportunities extraction" \
  --type feature --risk medium \
  --linked-hl H-1 --linked-story S-10 --linked-prd "$PRD1" \
  --linked-requirements "R-5" \
  --linked-copy "C-5" \
  --linked-inputs "" \
  --linked-trace "TR-6" \
  --linked-ac "AC-10.1;AC-10.2" \
  --description "LLM synthesizes 3-5 capitalize-able opportunities from gaps + feature list. Each opportunity is concrete and actionable."

mint --title "Output emission: MD + HTML always, DOCX when pandoc" \
  --type feature --risk low \
  --linked-hl H-1 --linked-story S-11 --linked-prd "$PRD1" \
  --linked-requirements "R-7" \
  --linked-copy "C-6;C-9;C-12" \
  --linked-inputs "IN-4" \
  --linked-trace "TR-7" \
  --linked-ac "AC-11.1;AC-11.2;AC-11.3" \
  --description "Render aggregated extraction into _docs/clones/<slug>/<slug>.clone.{md,html}; pandoc → .docx when present on PATH (mirror bootstrap precedent). Section headings align with /product:bootstrap for downstream handoff."

mint --title "Paths registration on first emit" \
  --type feature --risk low \
  --linked-hl H-5 --linked-story S-12 --linked-prd "$PRD1" \
  --linked-requirements "R-8" \
  --linked-copy "C-12" \
  --linked-inputs "" \
  --linked-trace "TR-7" \
  --linked-ac "AC-12.1;AC-12.2" \
  --description "On first successful emit, add paths.clones and paths.clonesCurrent to .claude/paths.json (bootstrap precedent). Idempotent across re-runs."

mint --title "Telemetry events for clone lifecycle" \
  --type trace --risk low \
  --linked-hl H-2 --linked-story S-13 --linked-prd "$PRD1" \
  --linked-requirements "R-9" \
  --linked-copy "" \
  --linked-inputs "" \
  --linked-trace "TR-1;TR-2;TR-3;TR-4;TR-5;TR-6;TR-7" \
  --linked-ac "AC-13.1;AC-13.2" \
  --description "Wire clone_started, product_identified, urls_discovered, source_fetched, source_failed, attribution_stripped, extraction_completed, clone_emitted to paths.eventsFile per TR-1..TR-7. Fail-open."

mint --title "Partial-deliverable mode with [GAP] markers" \
  --type feature --risk medium \
  --linked-hl H-3 --linked-story S-14 --linked-prd "$PRD1" \
  --linked-requirements "R-10;R-11" \
  --linked-copy "C-6" \
  --linked-inputs "IN-8" \
  --linked-trace "TR-4;TR-7" \
  --linked-ac "AC-14.1;AC-14.2" \
  --description "When any source fetch fails, render [GAP — <source> — <reason>] inline and continue; deliverable still emits. With --strict, abort on first failure instead."

echo ""
SPRINT_ID="SP-20260520-002"
echo "=== SP-20260520-002 / product:import tickets (8) ==="

mint --title "Skill spec + CLI surface" \
  --type feature --risk low \
  --linked-hl H-1 --linked-story S-1 --linked-prd "$PRD2" \
  --linked-requirements "R-1;R-2" \
  --linked-copy "C-1" \
  --linked-inputs "IN-1;IN-2;IN-3" \
  --linked-trace "TR-1" \
  --linked-ac "AC-1.1;AC-1.2;AC-1.3" \
  --description "/product:import skill spec under .claude/commands/product/import.md + scripts/product/import.js generator. CLI flags: --slug, --section-set, --output-dir, --no-introspect, --parse, --for. Mirror bootstrap.js architecture."

mint --title "Bounded project introspection pass" \
  --type feature --risk low \
  --linked-hl H-3 --linked-story S-2 --linked-prd "$PRD2" \
  --linked-requirements "R-3" \
  --linked-copy "C-2;C-3;C-4" \
  --linked-inputs "IN-4;IN-7" \
  --linked-trace "TR-2" \
  --linked-ac "AC-2.1;AC-2.2;AC-2.3" \
  --description "Read PROJECT.md, README.md, package.json, last 10 commits (5s timeout, 64KB cap per file). Extract name/stack/age hints into questionnaire preamble. --no-introspect disables. D-4 bounded."

mint --title "Questionnaire template (sections + per-section response-format hint)" \
  --type feature --risk medium \
  --linked-hl H-1 --linked-story S-3 --linked-prd "$PRD2" \
  --linked-requirements "R-4" \
  --linked-copy "C-7" \
  --linked-inputs "IN-8" \
  --linked-trace "" \
  --linked-ac "AC-3.1;AC-3.2;AC-3.3" \
  --description "Template renders one section per /product:bootstrap section (minimal=8, extended=12). Per-section question + per-section response-format hint. Stable section ids matched to bootstrap's sections.json."

mint --title "Universal phrasing across 5 surfaces" \
  --type docs --risk medium \
  --linked-hl H-1 --linked-story S-4 --linked-prd "$PRD2" \
  --linked-requirements "R-6" \
  --linked-copy "C-7" \
  --linked-inputs "" \
  --linked-trace "" \
  --linked-ac "AC-4.1;AC-4.2" \
  --description "Author universal-English prompts: no slash commands, no IDE-specific affordances, no surface-specific markdown. v1 emits one universal questionnaire (D-3 deferred per-surface presets)."

mint --title "Output emission + paths registration" \
  --type feature --risk low \
  --linked-hl H-1 --linked-story S-5 --linked-prd "$PRD2" \
  --linked-requirements "R-5;R-8" \
  --linked-copy "C-8;C-9" \
  --linked-inputs "" \
  --linked-trace "TR-3" \
  --linked-ac "AC-5.1;AC-5.2;AC-5.3" \
  --description "Write _docs/imports/<slug>/<slug>.questionnaire.md. On first emit, register paths.imports + paths.importsCurrent in .claude/paths.json (idempotent)."

mint --title "Telemetry events for import lifecycle" \
  --type trace --risk low \
  --linked-hl H-5 --linked-story S-6 --linked-prd "$PRD2" \
  --linked-requirements "R-9" \
  --linked-copy "" \
  --linked-inputs "" \
  --linked-trace "TR-1;TR-2;TR-3;TR-4;TR-5;TR-6" \
  --linked-ac "AC-6.1;AC-6.2" \
  --description "Wire import_started, context_introspected, questionnaire_emitted, parse_started, parse_completed, parse_failed_section_mismatch to paths.eventsFile. Fail-open."

mint --title "Section parity check vs /product:bootstrap" \
  --type qa --risk medium \
  --linked-hl H-2 --linked-story S-7 --linked-prd "$PRD2" \
  --linked-requirements "R-4;R-7;R-10" \
  --linked-copy "C-6" \
  --linked-inputs "" \
  --linked-trace "" \
  --linked-ac "AC-7.1;AC-7.2;AC-7.3" \
  --description "CI-time and runtime check that import's section set matches bootstrap's sections.json 1:1. Drift = test fail. Closes round-trip risk per R-7."

mint --title "--parse mode: pasted markdown → answers.json" \
  --type feature --risk high \
  --linked-hl H-4 --linked-story S-8 --linked-prd "$PRD2" \
  --linked-requirements "R-7;R-9" \
  --linked-copy "C-5;C-6" \
  --linked-inputs "IN-5" \
  --linked-trace "TR-4;TR-5;TR-6" \
  --linked-ac "AC-8.1;AC-8.2;AC-8.3" \
  --description "Parse operator-pasted markdown answers → JSON map matching scripts/product/bootstrap.js#sanitizeAnswer shape (D-2). On section mismatch, emit C-6 diagnostic and exit non-zero (no silent drop). Highest-risk ticket."

echo ""
echo "=== DONE ==="
