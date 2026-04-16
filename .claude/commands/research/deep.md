---
description: Real deep research — Gemini Thinking writes the brief, then OpenAI Deep Research API + Gemini Deep Research API + Claude multi-round search run in parallel
---

# /research:deep — Real Deep Research Pipeline

Uses the actual deep research engines (not just "be thorough" prompts):
- **Brief**: Gemini Thinking (gemini-3.1-pro-preview) writes the research prompt
- **OpenAI**: Deep Research API (`o3-deep-research` via Responses API) — autonomous multi-step web crawling
- **Gemini**: Deep Research API (`deep-research-pro-preview-12-2025` via Interactions API) — autonomous research agent
- **Claude**: Multi-round iterative WebSearch + WebFetch (3 rounds) — best available without API-level deep research

## Input

`$ARGUMENTS` — A research topic or question. Can be brief — Gemini Thinking will expand it.

If no arguments provided, ask the user for a research brief.

## Phase 0: Prerequisites Check

Before anything, verify what's available:

```bash
# Load API keys from .env.local (Next.js convention — keys aren't in shell env)
if [ -f .env.local ]; then
  export $(grep -E "^(OPENAI_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY)=" .env.local | xargs)
  echo "Loaded keys from .env.local"
fi

# Check API keys
echo "OPENAI_API_KEY: $([ -n "$OPENAI_API_KEY" ] && echo SET || echo MISSING)"
echo "GEMINI_API_KEY: $([ -n "$GEMINI_API_KEY" ] && echo SET || echo MISSING)"
echo "GOOGLE_API_KEY: $([ -n "$GOOGLE_API_KEY" ] && echo SET || echo MISSING)"

# Check OAuth token from Gemini CLI (~/.gemini/oauth_creds.json)
GEMINI_OAUTH_TOKEN=$(node -e "try{const d=require(require('os').homedir()+'/.gemini/oauth_creds.json');if(Date.now()<d.expiry_date)console.log(d.access_token);else console.log('EXPIRED')}catch(e){console.log('NONE')}" 2>/dev/null)
echo "Gemini OAuth: $([ "$GEMINI_OAUTH_TOKEN" != "NONE" ] && [ "$GEMINI_OAUTH_TOKEN" != "EXPIRED" ] && echo "VALID" || echo "$GEMINI_OAUTH_TOKEN")"

# Check CLIs
which codex 2>/dev/null && echo "Codex CLI: OK" || echo "Codex CLI: MISSING"
which gemini 2>/dev/null && echo "Gemini CLI: OK" || echo "Gemini CLI: MISSING"

# Verify OpenAI deep research models are actually accessible (not just API key present)
if [ -n "$OPENAI_API_KEY" ]; then
  DR_COUNT=$(curl -s "https://api.openai.com/v1/models" -H "Authorization: Bearer $OPENAI_API_KEY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log((j.data||[]).filter(m=>m.id.includes('deep-research')).length)})" | tr -d '\r')
  if [ "$DR_COUNT" = "0" ]; then
    echo "OpenAI deep research: NOT AVAILABLE (models not in account — verify org at platform.openai.com)"
    echo "OpenAI engine will be SKIPPED"
  else
    echo "OpenAI deep research: $DR_COUNT models available"
  fi
fi
```

**Auth priority for Gemini Interactions API**:
1. `GEMINI_API_KEY` env var (most reliable)
2. `GOOGLE_API_KEY` env var
3. OAuth token from `~/.gemini/oauth_creds.json` (extracted via node — may expire mid-run)

Log which engines are available. If all auth methods fail for an engine, skip it (no CLI fallback — CLI produces inferior non-deep-research output). Continue with whatever is available — never abort the whole pipeline for one missing key.

## Phase 1: Research Brief via Gemini Thinking

Generate `topic-slug` from the user's input (lowercase, hyphenated, max 40 chars).

Create output directory: `docs/99-resources/research/{topic-slug}/` and `docs/99-resources/research/{topic-slug}/.tmp/`

**Write the prompt to a temp file** (never inline complex prompts in bash):

```bash
mkdir -p "$OUTDIR/.tmp"
cat > "$OUTDIR/.tmp/research-brief-prompt.txt" << 'PROMPT_EOF'
You are a Research Director planning a multi-team investigation. Three autonomous research agents will execute your brief in parallel — each with different strengths:

- OpenAI o3: Deep logical chains, fault-tree analysis, mathematical reasoning. Give it hard analytical constraints and deductive tasks.
- Gemini Deep Research: Massive context ingestion, web grounding, broad data synthesis. Ask it to pull and compare large amounts of raw data, code examples, and documentation.
- Claude: Nuanced qualitative analysis, iterative web searching, source verification. Ask it to investigate the contrarian angle and cross-verify claims.

USER'S TOPIC: {$ARGUMENTS}

CONTEXT: This research will be applied to a production software project. Read CLAUDE.md and PROJECT.md (if they exist) for project-specific context. If unavailable, treat as general software engineering research.

Produce a research brief as a JSON object. Organize the investigation into 4 phases, each with its own sub-questions, evidence priorities, and completion criteria:

{
  "research_question": "A precise, well-scoped question (not too broad, not too narrow)",
  "phases": [
    {
      "name": "Landscape",
      "objective": "Survey the current state — what exists, who are the key players, what approaches are in use",
      "sub_questions": ["1-2 questions about the current state of the field"],
      "evidence_priorities": "What to look for: official docs, market surveys, framework comparisons, adoption data",
      "stop_condition": "Complete when 3+ distinct approaches/tools/architectures identified"
    },
    {
      "name": "Mechanics",
      "objective": "How does it actually work — implementation details, code patterns, architectures",
      "sub_questions": ["1-2 questions about implementation specifics"],
      "evidence_priorities": "What to look for: production code examples, GitHub repos, engineering blogs with architecture diagrams",
      "stop_condition": "Complete when 2+ real implementation examples with code found"
    },
    {
      "name": "Failure Modes",
      "objective": "What breaks — post-mortems, edge cases, cost blowups, known limitations",
      "sub_questions": ["1-2 questions about what goes wrong"],
      "evidence_priorities": "What to look for: incident reports, post-mortems, HN discussions, CVEs, cost horror stories",
      "stop_condition": "Complete when 5+ distinct failure modes documented with mitigations"
    },
    {
      "name": "Contrarian",
      "objective": "Why might the premise be wrong — strongest arguments against, better alternatives",
      "sub_questions": ["1 question challenging the core assumption"],
      "evidence_priorities": "What to look for: critical analyses, alternative architectures, industry predictions against",
      "stop_condition": "Complete when 2+ substantive counter-arguments found with evidence"
    }
  ],
  "search_strategy": ["8-12 suggested search queries, keywords, and domain-specific terms"],
  "exclusion_criteria": ["What NOT to research — e.g., results before 2024, low-code platforms, theoretical papers without production data"],
  "required_output_schema": {
    "sections": ["Executive Summary", "Phase 1: Landscape", "Phase 2: Mechanics", "Phase 3: Failure Modes", "Phase 4: Contrarian", "Source Registry", "Confidence Matrix"],
    "per_finding_format": "Each finding must include: claim, supporting evidence, confidence (HIGH/MEDIUM/LOW), source URLs, and counter-evidence if any",
    "per_source_format": "Each source must include: URL, title, credibility (1-5), recency, type (primary/secondary/opinion)"
  },
  "openai_instructions": "Specific analytical constraints optimized for o3 reasoning — focus on logical deduction, fault-tree analysis, edge case mapping",
  "gemini_instructions": "Specific data-gathering instructions optimized for broad search — ingest docs, compare APIs, extract code examples, synthesize raw data",
  "claude_instructions": "Specific verification instructions — investigate the contrarian angle, cross-verify claims between sources, assess qualitative trade-offs"
}

Write ONLY the JSON — no preamble, no markdown fences, no commentary. Fill in all fields with specific, actionable content for the given topic.
PROMPT_EOF
```

Then invoke Gemini. **Follow this model chain exactly — try each in order, stop on first success:**

```bash
# Model chain: gemini-3.1-pro-preview → Claude writes it
cat "$OUTDIR/.tmp/research-brief-prompt.txt" | gemini -m gemini-3.1-pro-preview -p "Generate the research brief JSON from the instructions provided on stdin" -o text 2>/dev/null > "$OUTDIR/.tmp/research-brief-output.json"
```

If both Gemini models fail (output file empty or 0 bytes), write the brief yourself as a fallback.

Parse the JSON output. Save to `docs/99-resources/research/{topic-slug}/BRIEF.md`:

```markdown
# Research Brief: {Topic}

**Generated by:** Gemini Thinking (gemini-3.1-pro-preview)
**Date:** {YYYY-MM-DD}
**Original query:** {$ARGUMENTS}

{formatted brief content — render the JSON fields as readable markdown sections}
```

Also save the raw JSON to `docs/99-resources/research/{topic-slug}/brief.json` for machine parsing.

Read the saved brief back — this is what goes to all three engines (with per-engine instructions).

## Phase 2: Parallel Deep Research (3 engines)

Launch ALL THREE in parallel (single message with 3 tool calls). Each engine gets the common brief PLUS its engine-specific instructions from Phase 1.

### Execution Rules (MANDATORY)

1. **Follow fallback chains exactly as written.** Never skip a model based on what happened in a previous run. Error conditions change between runs (rate limits are transient, verification propagates, quotas reset). Always start from the top of the chain.
2. **No assumptions from prior runs.** Each research run is independent. A model that failed yesterday may work today. A model that worked yesterday may fail today. The fallback chain handles this — trust the process.
3. **Use the bash scripts from this skill verbatim.** Do not rewrite, simplify, or "optimize" the engine scripts between runs. If a fix is needed, edit THIS skill file so the fix is permanent, then follow the updated skill.
4. **When something fails, fix the skill — not just the current run.** Every workaround that isn't written back into this skill file will be forgotten by next run. Temporary fixes are not fixes.

**IMPORTANT**: Each Bash tool call runs in a separate shell. Every bash block that uses API keys MUST start with:
```bash
export $(grep -E "^(OPENAI_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY)=" .env.local 2>/dev/null | xargs)
```

**Before launching**: Create a session file for crash recovery:
```bash
echo '{}' > "docs/99-resources/research/{topic-slug}/.session.json"
```

---

### Engine 1: OpenAI Deep Research (Responses API — 4-Phase)

**If `OPENAI_API_KEY` is set** — use the real Deep Research API via curl.

**TPM mitigation**: Instead of one monolithic request (which burns ~176k tokens and hits the 200k TPM limit), we split into 4 phase-by-phase requests with `max_tool_calls: 12` each. Wait 90s between phases for the TPM window to reset.

**Fallback chain**: `o3-deep-research` → `o4-mini-deep-research`. No Codex CLI fallback — deep research only.
Both deep research models require org verification at https://platform.openai.com/settings/organization/general.
The API accepts requests but fails asynchronously if unverified — detect on first poll and try next model.

```bash
export $(grep -E "^(OPENAI_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY)=" .env.local 2>/dev/null | xargs)
OUTDIR="docs/99-resources/research/{topic-slug}"
mkdir -p "$OUTDIR/.tmp"

# Helper: build input for a single phase (0-indexed) — writes to $OUTDIR/.tmp/phase-input.txt
build_phase_input() {
  local PHASE_IDX="$1"
  node -e "
const brief = require('./$OUTDIR/brief.json');
const p = brief.phases[$PHASE_IDX];
const prevPhases = brief.phases.slice(0, $PHASE_IDX).map(x => '(Already researched) ' + x.name + ': ' + x.objective).join('\n');
const input = brief.research_question + '\n\n' + brief.openai_instructions + '\n\nFocus on this specific research phase:\n' + p.name + ': ' + p.objective + '\n  Questions: ' + p.sub_questions.join('; ') + '\n  Evidence priorities: ' + p.evidence_priorities + '\n  Stop when: ' + p.stop_condition + (prevPhases ? '\n\nContext from prior phases:\n' + prevPhases : '') + '\n\nWrite a structured markdown report for this phase only. Include findings with claims, evidence, confidence levels, and source URLs.';
require('fs').writeFileSync('./$OUTDIR/.tmp/phase-input.txt', input);
" | tr -d '\r'
}

# Function: try one phase of deep research, return 0 on success, 1 on failure
# Args: $1=model, $2=phase_index, $3=phase_name
try_phase() {
  local MODEL="$1"
  local PHASE_IDX="$2"
  local PHASE_NAME="$3"
  echo "  Phase $((PHASE_IDX+1))/4: $PHASE_NAME ($MODEL)..."
  
  # Build phase-specific input to temp file, then payload from temp file (Windows-safe — no /dev/stdin)
  build_phase_input "$PHASE_IDX"
  node -e "
const fs = require('fs');
const input = fs.readFileSync('./$OUTDIR/.tmp/phase-input.txt', 'utf8');
const payload = {model:'$MODEL',input:input,background:true,max_tool_calls:12,tools:[{type:'web_search_preview'}]};
fs.writeFileSync('./$OUTDIR/.tmp/openai-payload.json', JSON.stringify(payload));
" | tr -d '\r'
  
  # Submit
  RESPONSE=$(curl -s -X POST 'https://api.openai.com/v1/responses' \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H 'Content-Type: application/json' \
    -d @$OUTDIR/.tmp/openai-payload.json)
  
  # Check immediate error
  IMMEDIATE_ERROR=$(echo "$RESPONSE" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.error?.message||'')})" | tr -d '\r')
  if [ -n "$IMMEDIATE_ERROR" ]; then
    echo "  $MODEL phase $PHASE_NAME immediate error: $IMMEDIATE_ERROR"
    return 1
  fi
  
  RESPONSE_ID=$(echo "$RESPONSE" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).id)}catch(e){console.log('')}})" | tr -d '\r')
  if [ -z "$RESPONSE_ID" ]; then
    echo "  $MODEL phase $PHASE_NAME — no response ID"
    return 1
  fi
  
  echo "  Started: $RESPONSE_ID"
  
  # Poll — first check after 15s to detect async failures fast
  sleep 15
  RESULT=$(curl -s "https://api.openai.com/v1/responses/$RESPONSE_ID" -H "Authorization: Bearer $OPENAI_API_KEY")
  FIRST_STATUS=$(echo "$RESULT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.status||'unknown')})" | tr -d '\r')
  
  if [ "$FIRST_STATUS" = "failed" ]; then
    FAIL_MSG=$(echo "$RESULT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.error?.message||j.error?.code||'unknown')})" | tr -d '\r')
    echo "  $PHASE_NAME failed on first poll: $FAIL_MSG"
    echo "$RESULT" > "$OUTDIR/openai-error-$MODEL-phase$PHASE_IDX.log"
    return 1
  fi
  
  # Poll with 15-min timeout per phase
  MAX_SECONDS=900
  START_TIME=$(date +%s)
  SLEEP_INTERVAL=15
  
  while true; do
    ELAPSED=$(( $(date +%s) - START_TIME ))
    if [ $ELAPSED -gt $MAX_SECONDS ]; then
      echo "  $PHASE_NAME polling timeout after ${MAX_SECONDS}s"
      return 1
    fi

    HTTP_CODE=$(curl -s -o $OUTDIR/.tmp/openai-result.json -w "%{http_code}" \
      "https://api.openai.com/v1/responses/$RESPONSE_ID" \
      -H "Authorization: Bearer $OPENAI_API_KEY")

    if [ "$HTTP_CODE" = "429" ]; then
      echo "  Rate limited — backing off 60s..."
      sleep 60
      continue
    elif [ "$HTTP_CODE" != "200" ]; then
      sleep $SLEEP_INTERVAL
      continue
    fi

    STATUS=$(node -e "try{const d=JSON.parse(require('fs').readFileSync('./$OUTDIR/.tmp/openai-result.json','utf8'));console.log(d.status||'unknown')}catch(e){console.log('parse_error')}" | tr -d '\r')

    if [ "$STATUS" = "completed" ]; then
      node -e "
const d=JSON.parse(require('fs').readFileSync('./$OUTDIR/.tmp/openai-result.json','utf8'));
let text='';
for(const item of (d.output||[])){
  if(item.type==='message'){
    for(const c of (item.content||[])){
      if(c.type==='output_text') text+=c.text+'\n';
    }
  }
}
require('fs').writeFileSync('./$OUTDIR/.tmp/openai-phase-${PHASE_IDX}.md', text);
" | tr -d '\r'
      echo "  $PHASE_NAME complete (${ELAPSED}s)"
      return 0
    elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "expired" ]; then
      FAIL_MSG=$(node -e "try{const d=JSON.parse(require('fs').readFileSync('./$OUTDIR/.tmp/openai-result.json','utf8'));console.log(d.error?.message||d.error?.code||'unknown')}catch(e){console.log('unknown')}" | tr -d '\r')
      echo "  $PHASE_NAME failed: $STATUS — $FAIL_MSG"
      cp $OUTDIR/.tmp/openai-result.json "$OUTDIR/openai-error-$MODEL-phase$PHASE_IDX.log"
      return 1
    fi

    echo "  $PHASE_NAME: $STATUS (${ELAPSED}s)..."
    sleep $SLEEP_INTERVAL
    [ $SLEEP_INTERVAL -lt 60 ] && SLEEP_INTERVAL=$((SLEEP_INTERVAL * 2))
  done
  return 1
}

# Orchestrator: run all 4 phases sequentially with TPM cooldown
run_all_phases() {
  local MODEL="$1"
  local PHASE_NAMES=("Landscape" "Mechanics" "Failure-Modes" "Contrarian")
  
  echo "=== OpenAI 4-phase deep research with $MODEL ==="
  
  for i in 0 1 2 3; do
    try_phase "$MODEL" "$i" "${PHASE_NAMES[$i]}"
    if [ $? -ne 0 ]; then
      echo "$MODEL failed on phase ${PHASE_NAMES[$i]} — aborting this model"
      rm -f $OUTDIR/.tmp/openai-phase-*.md
      return 1
    fi
    
    if [ $i -lt 3 ]; then
      echo "  Waiting 90s for TPM window reset..."
      sleep 90
    fi
  done
  
  # Reassemble phase reports into final report
  node -e "
const fs = require('fs');
const phases = [0,1,2,3].map(i => {
  const f = './$OUTDIR/.tmp/openai-phase-' + i + '.md';
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim() : '';
}).filter(Boolean);
fs.writeFileSync('./$OUTDIR/openai-report.md', phases.join('\n\n---\n\n'));
console.log('OpenAI report assembled from ' + phases.length + ' phases');
" | tr -d '\r'
  return 0
}

# Fallback chain: o3-deep-research (all 4 phases) → o4-mini-deep-research (all 4 phases)
run_all_phases "o3-deep-research" || \
run_all_phases "o4-mini-deep-research" || \
echo "Both OpenAI deep research models failed. OpenAI engine will be absent from synthesis."

# Cleanup
rm -f $OUTDIR/.tmp/openai-payload.json $OUTDIR/.tmp/openai-result.json $OUTDIR/.tmp/openai-phase-*.md $OUTDIR/.tmp/phase-input.txt
```

**If `OPENAI_API_KEY` is NOT set** — skip OpenAI engine entirely. Log: "OPENAI_API_KEY not set — OpenAI deep research skipped."

---

### Engine 2: Gemini Deep Research (Interactions API)

**Determine auth method**:
```bash
export $(grep -E "^(OPENAI_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY)=" .env.local 2>/dev/null | xargs)
if [ -n "$GEMINI_API_KEY" ]; then
  AUTH_HEADER="x-goog-api-key: $GEMINI_API_KEY"
elif [ -n "$GOOGLE_API_KEY" ]; then
  AUTH_HEADER="x-goog-api-key: $GOOGLE_API_KEY"
else
  # Try OAuth token from Gemini CLI
  OAUTH_TOKEN=$(node -e "try{const d=require(require('os').homedir()+'/.gemini/oauth_creds.json');if(Date.now()<d.expiry_date)console.log(d.access_token);else console.log('')}catch(e){console.log('')}" | tr -d '\r')
  if [ -n "$OAUTH_TOKEN" ]; then
    AUTH_HEADER="Authorization: Bearer $OAUTH_TOKEN"
  else
    echo "NO_GEMINI_AUTH — no API key and no valid OAuth token. Gemini engine SKIPPED."
    echo "Set GEMINI_API_KEY in .env.local or run 'gemini auth login' for OAuth."
    exit 1
  fi
fi
```

**If auth is available** — use the real Deep Research API:

```bash
export $(grep -E "^(OPENAI_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY)=" .env.local 2>/dev/null | xargs)
OUTDIR="docs/99-resources/research/{topic-slug}"
mkdir -p "$OUTDIR/.tmp"

# Build payload via temp file
node -e "
const fs = require('fs');
const brief = JSON.parse(fs.readFileSync('./$OUTDIR/brief.json','utf8'));
const phases = brief.phases.map(p => p.name + ': ' + p.objective + '\n  Questions: ' + p.sub_questions.join('; ') + '\n  Evidence: ' + p.evidence_priorities + '\n  Stop when: ' + p.stop_condition).join('\n\n');
const payload = {
  input: brief.research_question + '\n\n' + brief.gemini_instructions + '\n\nResearch Phases:\n' + phases + '\n\nOutput format: ' + JSON.stringify(brief.required_output_schema),
  agent: 'deep-research-pro-preview-12-2025',
  background: true,
  store: true
};
fs.writeFileSync('./$OUTDIR/.tmp/gemini-payload.json', JSON.stringify(payload));
" | tr -d '\r'

# Create deep research interaction
RESPONSE=$(curl -s -X POST 'https://generativelanguage.googleapis.com/v1beta/interactions' \
  -H "$AUTH_HEADER" \
  -H 'Content-Type: application/json' \
  -d @$OUTDIR/.tmp/gemini-payload.json)

INTERACTION_ID=$(echo "$RESPONSE" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).id)}catch(e){console.log('')}})" | tr -d '\r')

if [ -z "$INTERACTION_ID" ]; then
  echo "GEMINI_DEEP_RESEARCH_FAILED — could not create interaction."
  echo "Response: $(echo "$RESPONSE" | head -c 500)"
  echo "Gemini engine SKIPPED. Check API key validity and model availability."
  exit 1
fi

echo "Gemini Deep Research started: $INTERACTION_ID"

# Save ID for crash recovery
node -e "const fs=require('fs');const f='./$OUTDIR/.session.json';const d=JSON.parse(fs.readFileSync(f,'utf8'));d.gemini_id='$INTERACTION_ID';fs.writeFileSync(f,JSON.stringify(d,null,2))"

# Poll with exponential backoff and hard timeout
MAX_SECONDS=2700
START_TIME=$(date +%s)
SLEEP_INTERVAL=15

trap 'echo "Interrupted — Gemini research $INTERACTION_ID still running in background"; exit 130' SIGINT

while true; do
  ELAPSED=$(( $(date +%s) - START_TIME ))
  if [ $ELAPSED -gt $MAX_SECONDS ]; then
    echo "Gemini polling timeout after ${MAX_SECONDS}s"
    break
  fi

  HTTP_CODE=$(curl -s -o $OUTDIR/.tmp/gemini-result.json -w "%{http_code}" \
    "https://generativelanguage.googleapis.com/v1beta/interactions/$INTERACTION_ID" \
    -H "$AUTH_HEADER")

  if [ "$HTTP_CODE" = "429" ]; then
    echo "Gemini rate limited — backing off 60s..."
    sleep 60
    continue
  elif [ "$HTTP_CODE" != "200" ]; then
    echo "Gemini HTTP $HTTP_CODE — retrying in ${SLEEP_INTERVAL}s..."
    sleep $SLEEP_INTERVAL
    continue
  fi

  STATUS=$(cat "$OUTDIR/.tmp/gemini-result.json" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(j.status||'unknown')})" | tr -d '\r')

  if [ "$STATUS" = "completed" ]; then
    node -e "
const fs=require('fs');
const d=JSON.parse(fs.readFileSync('./$OUTDIR/.tmp/gemini-result.json','utf8'));
const outputs=d.outputs||[];
const last=outputs[outputs.length-1];
fs.writeFileSync('./$OUTDIR/gemini-report.md', last?last.text||'':'');
" | tr -d '\r'
    echo "Gemini Deep Research complete (${ELAPSED}s)"
    break
  elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "cancelled" ]; then
    echo "Gemini Deep Research failed: $STATUS"
    cp $OUTDIR/.tmp/gemini-result.json "$OUTDIR/gemini-error.log"
    break
  fi

  echo "Gemini: $STATUS (${ELAPSED}s elapsed) — next poll in ${SLEEP_INTERVAL}s..."
  sleep $SLEEP_INTERVAL
  [ $SLEEP_INTERVAL -lt 60 ] && SLEEP_INTERVAL=$((SLEEP_INTERVAL * 2))
done

# Cleanup
rm -f $OUTDIR/.tmp/gemini-payload.json $OUTDIR/.tmp/gemini-result.json
```

**If all auth fails** — Gemini engine is SKIPPED (no CLI fallback). Log the failure clearly so the user knows to set `GEMINI_API_KEY` or authenticate via `gemini auth login`.

---

### Engine 3: Claude (Multi-Round WebSearch + WebFetch)

Use the Agent tool with a general-purpose agent. Claude has no deep research API, so we compensate with iterative multi-round searching.

Agent prompt (include the `claude_instructions` from the brief):

```
You are conducting deep research across 4 phases. Be exhaustive — this is the deep research pipeline.

RESEARCH BRIEF:
{full brief from Phase 1, including claude_instructions and all 4 phases}

OUTPUT FILE: docs/99-resources/research/{topic-slug}/claude-report.md

PROCESS — follow these 4 phases mapped to 3 search rounds:

ROUND 1 — LANDSCAPE + MECHANICS (Phases 1-2):
- Run 8-12 WebSearch queries covering: current state of the field, key players, implementation patterns
- WebFetch the 5 most promising results
- Note: what's well-covered, what has gaps, which sources are most authoritative
- Check stop conditions: 3+ approaches identified? 2+ code examples found?

ROUND 2 — FAILURE MODES (Phase 3):
- Run 5-8 WebSearch queries targeting: post-mortems, incident reports, CVEs, cost blowups, edge cases
- WebFetch 3-5 new sources focusing on what breaks and why
- Cross-reference claims from Round 1 — flag contradictions
- Check stop condition: 5+ failure modes documented?

ROUND 3 — CONTRARIAN + VERIFICATION (Phase 4):
- WebSearch for counterarguments, criticisms, alternative approaches
- WebFetch 2-3 contrarian/critical sources
- Verify the top 3 most important claims from Rounds 1-2 against primary sources
- Check stop condition: 2+ substantive counter-arguments found?

After all 3 rounds, write the report with this structure:

# {Topic} — Claude Deep Research Report

## Executive Summary (3-5 sentences)

## Phase 1: Landscape
(Current state, key players, approaches — with findings in format: claim + evidence + confidence + sources)

## Phase 2: Mechanics
(Implementation details, code patterns, architectures)

## Phase 3: Failure Modes
(What breaks, post-mortems, edge cases, cost incidents)

## Phase 4: Contrarian
(Why the premise might be wrong, alternative approaches, industry skepticism)

## Source Registry
({count} sources across 3 rounds)
For each: URL, title, credibility (1-5), recency, type (primary/secondary/opinion)

## Confidence Matrix
For each major finding: claim, confidence (HIGH/MEDIUM/LOW), supporting evidence, counter-evidence

## Gaps Remaining
(What you couldn't find or verify, organized by phase)
```

---

**CRITICAL**: Launch all three (Bash + Bash + Agent) in a single message with 3 parallel tool calls. The two bash scripts run as Bash commands, the Claude agent runs as an Agent tool call.

## Phase 3: Collect & Cross-Validate

After all three complete:

1. Check which reports were created:
```bash
for f in openai-report.md gemini-report.md claude-report.md; do
  path="docs/99-resources/research/{topic-slug}/$f"
  if [ -f "$path" ]; then
    lines=$(wc -l < "$path")
    echo "$f: $lines lines"
  else
    echo "$f: MISSING"
  fi
done
```

2. Read each successful report
3. If fewer than 2 reports exist, warn the user but continue

### Source Verification Pass

From across all reports, pick the 5 most important cited URLs. Use WebFetch to verify each one actually exists and supports the claim made. Record results for synthesis.

## Phase 4: Deep Synthesis

Read all available reports and verification results. Create `docs/99-resources/research/{topic-slug}/SYNTHESIS.md`:

```markdown
# {Topic} — Deep Research Synthesis

**Date:** {YYYY-MM-DD}
**Method:** Real Deep Research (OpenAI o3-deep-research + Gemini deep-research-pro + Claude 3-round search)
**Brief by:** Gemini Thinking (gemini-3.1-pro-preview)
**Engines:** {list which succeeded and which failed/fell back}
**Original query:** {$ARGUMENTS}
**Estimated cost:** ~${X.XX} (OpenAI: ${a}, Gemini: ${b}, Claude: included)

## Executive Summary

The single most important finding, in 3 sentences.

## Cross-Validation Matrix

| Finding | OpenAI | Gemini | Claude | Verified | Confidence |
|---------|--------|--------|--------|----------|------------|
| {finding} | {agree/disagree/silent} | ... | ... | {Y/N} | {H/M/L} |

## Consensus (all engines agree)

## High-Confidence Insights

Findings verified against primary sources.

## Disagreements & Resolution

Where engines contradict — which is correct, based on source quality.
Flag numerical disagreements specifically (e.g., "$5B vs $50B" → needs human review).

## Hallucination Check

Sources cited that don't exist or don't say what was claimed.

## Sub-Question Answers

### SQ1: {question}
**Answer:** {synthesized}
**Confidence:** {H/M/L}
**Best source:** {URL}

(repeat for each sub-question)

## Practical Takeaways

Ranked by confidence AND actionability:
1. {takeaway} — Confidence: {H/M/L}, Actionable: {now/soon/later}

## Applicability to This Project

How findings apply to the current project. Read CLAUDE.md and PROJECT.md for context on what the project does and its tech stack.

## Gaps & Future Research

What couldn't be answered. What needs experimentation.

## Engine Performance

| Engine | Method | Duration | Sources Found | Report Length |
|--------|--------|----------|---------------|---------------|
| OpenAI | {API/Codex fallback} | {time} | {count} | {lines} lines |
| Gemini | {API/CLI fallback} | {time} | {count} | {lines} lines |
| Claude | 3-round WebSearch | {time} | {count} | {lines} lines |

## Raw Reports

- [OpenAI Report](openai-report.md) — {method used}
- [Gemini Report](gemini-report.md) — {method used}
- [Claude Report](claude-report.md) — 3-round iterative search
- [Research Brief](BRIEF.md) — Generated by Gemini Thinking
```

## Phase 5: Apply Learnings

1. **Learnings**: For each HIGH-confidence actionable insight, append to `.claude/project/memory/learnings.jsonl`:
   ```json
   {"ts":"YYYY-MM-DD","intent":"external","tip":"the learning","effective":null,"pending_validation":true,"score":0,"source":"deep-research/{topic-slug}"}
   ```
   Only HIGH-confidence findings. MEDIUM stays in synthesis only.

2. **System improvements**: List as recommendations in synthesis. Do NOT auto-apply.

3. **Summary to user**:
   - Which engines used real deep research vs fallback
   - How many sources consulted across all engines
   - Cross-validation score (how many findings all 3 agreed on)
   - Top 3 actionable takeaways
   - Total wall-clock time
   - Estimated cost

## Phase 6: Research Recap

After everything is done (synthesis written, learnings saved), print a boxed terminal recap so the user remembers what was researched — they often return after the long wait having forgotten the topic. Format:

```
═══════════════════════════════════════════════════
  DEEP RESEARCH COMPLETE: {topic-slug}
═══════════════════════════════════════════════════
  Query:    {original user query}
  Engines:  {which succeeded} / {which failed or skipped}
  Duration: {total wall-clock time}
  Reports:  docs/99-resources/research/{topic-slug}/

  TOP 3 FINDINGS:
  1. {highest-confidence actionable finding}
  2. {second finding}
  3. {third finding}

  KEY NUMBER: {the single most surprising or important statistic}

  CONTRARIAN: {one-line summary of the strongest counter-argument}

  LEARNINGS SAVED: {N} to .claude/project/memory/learnings.jsonl
  FULL SYNTHESIS:  docs/99-resources/research/{topic-slug}/SYNTHESIS.md
═══════════════════════════════════════════════════
```

This recap is the LAST thing printed — it's the "what did we just do?" anchor.

## Error Handling

- API key missing → try OAuth token → skip engine (logged clearly)
- curl fails → capture HTTP code, retry with backoff (429 = 60s backoff)
- Polling timeout (15 min) → stop polling, use whatever partial results exist
- Engine skipped → log clearly with actionable error message (what key to set, what to verify)
- Only 1 report available → synthesize with reduced confidence
- 0 reports → report failure, suggest `/research` (standard) as fallback
- Gemini CLI fails for brief → write the brief yourself
- Never abort the entire pipeline for a single engine failure
- **CRLF handling**: All `node` output piped through `tr -d '\r'` for Windows/Git Bash compatibility
- **JSON payloads**: Always written to temp files, never inlined in bash (prevents escaping hell)
- **Crash recovery**: `.session.json` stores API request IDs — future runs can check if research already completed

## Fallback Chain Summary

| Engine | Primary | Fallback 1 | Fallback 2 |
|--------|---------|------------|------------|
| **Brief** | Gemini CLI (gemini-3.1-pro-preview) | Claude writes it directly | — |
| **OpenAI** | Deep Research API (o3-deep-research, 4-phase) | Deep Research API (o4-mini-deep-research, 4-phase) | Skip engine |
| **Gemini** | Interactions API + API key | Interactions API + OAuth token | Skip engine |
| **Claude** | 3-round WebSearch + WebFetch | (always available) | — |

**NOTE**: All bash blocks must load `.env.local` since each Bash tool call runs in a fresh shell:
```bash
export $(grep -E "^(OPENAI_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY)=" .env.local 2>/dev/null | xargs)
```

**CRITICAL — Gemini CLI headless mode**: The `-p` flag with actual text is **required** for non-interactive mode. Without `-p`, piped stdin causes the CLI to enter interactive mode, which hangs without a TTY and produces 0 bytes output. Always use: `echo "context" | gemini -p "instruction" -o text`. Never: `echo "text" | gemini -o text`.

**CRITICAL — Windows temp paths**: Never use `/tmp/` for file paths — on Windows/Git Bash, node resolves `/tmp/` to `C:\tmp\` which doesn't exist. Use `$OUTDIR/.tmp/` instead and `mkdir -p "$OUTDIR/.tmp"` at the start of each bash block.
