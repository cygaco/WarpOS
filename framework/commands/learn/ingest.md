---
description: Ingest external knowledge from files, links, or YouTube videos and apply learnings to the system
---

# /learner — External Knowledge Ingestion

Takes a file, URL, or YouTube video and extracts actionable knowledge. Analyzes it for relevance to the consumer product system. Proposes or auto-applies improvements to strategies, skills, hooks, linters, or specs.

## Usage

- `/learner path/to/file.md` — learn from a local file
- `/learner https://example.com/article` — learn from a web page
- `/learner https://youtube.com/watch?v=xxx` — learn from a YouTube video
- `/learner https://youtube.com/watch?v=xxx "focus on the part about testing"` — learn with focus hint

## Input Detection

Determine the input type and extract content accordingly:

### Local File
**Detection:** Input doesn't start with `http`
**Method:** Read the file directly with the Read tool
**Supported:** `.md`, `.txt`, `.pdf`, `.json`, `.js`, `.ts`, `.html`, any text file

### Web Page
**Detection:** Starts with `http` and is NOT a YouTube/youtu.be link
**Method:** Use WebFetch to retrieve the page content
**Fallback:** If WebFetch fails (paywall, JS-rendered), try:
1. WebSearch for the page title + "transcript" or "summary"
2. Ask user to paste the content manually

### YouTube Video
**Detection:** URL contains `youtube.com/watch`, `youtu.be/`, or `youtube.com/shorts`
**Method (try in order):**

1. **yt-dlp transcript extraction** (best quality):
   ```bash
   yt-dlp --write-auto-sub --sub-lang en --skip-download --output "%(id)s" "URL"
   ```
   Then read the generated `.vtt` or `.srt` file. Clean up VTT formatting (remove timestamps, deduplicate lines).

2. **WebFetch on transcript service:**
   Try fetching from a transcript extraction service or the YouTube page itself and parsing the captions.

3. **Manual fallback:**
   Tell the user: "I couldn't get the transcript automatically. Options:
   - Install yt-dlp: `pip install yt-dlp`
   - Paste the transcript manually
   - Share the video title so I can WebSearch for a summary"

### VTT/SRT Transcript Cleanup

Raw VTT files have timestamps and duplicated lines. Clean them:
```
1. Remove WEBVTT header and metadata
2. Remove timestamp lines (00:00:00.000 --> 00:00:03.000)
3. Remove duplicate consecutive lines (VTT repeats lines across segments)
4. Remove HTML tags (<c>, </c>, etc.)
5. Join into flowing paragraphs (every ~5 sentences)
```

## Analysis Pipeline

After extracting content, analyze it through these lenses:

### Step 1: Relevance Scan
Ask: "What in this content is relevant to the consumer product system?"

Categories to look for:
- **Prompting techniques** — better ways to communicate with AI
- **Agent patterns** — multi-agent coordination, evaluation, guard rails
- **Code quality** — testing, linting, error handling patterns
- **Architecture** — state management, data flow, API design
- **Process** — spec writing, review workflows, CI/CD
- **Security** — vulnerability patterns, auth best practices
- **UX/Design** — wizard patterns, progressive disclosure, error states
- **Meta/System** — self-improving systems, feedback loops, observability

### Step 2: Extract Insights
For each relevant section, extract:
```json
{
  "insight": "Plain English description of what was learned",
  "category": "prompting|agents|code|architecture|process|security|ux|meta",
  "confidence": "high|medium|low",
  "applicable_to": ["which parts of the system this applies to"],
  "source": "URL or file path",
  "source_context": "quote or summary from the original"
}
```

### Step 3: Map to System Components
For each insight, determine where it should be applied:

| Category | Target Files | Action Type |
|----------|-------------|-------------|
| prompting | context-enhancer.js, memory/learnings.jsonl | New enhancement strategy or learned tip |
| agents | .claude/agents/*.md, AGENT-SYSTEM.md | Agent behavior update, new agent proposal |
| code | scripts/lint-*.js, HYGIENE.md | New lint rule, hygiene pattern |
| architecture | docs/04-architecture/*.md, SPEC_GRAPH.json | Architecture doc update, new graph edge |
| process | .claude/commands/*.md, docs/03-*/*.md | Skill update, process doc update |
| security | docs/07-security/*.md, scripts/hooks/*-guard.js | Security policy, new guard hook |
| ux | docs/01-design-system/*.md, docs/05-features/*/COPY.md | Design pattern, copy improvement |
| meta | docs/00-canonical/*.md, CLAUDE.md, .claude/memory/ | System-level improvement |

### Step 4: Generate Proposals

For each applicable insight, generate a concrete proposal:

```
📚 Learning: [insight in plain English]
📖 Source: [URL/file, with relevant quote]
📍 Apply to: [target file]
🔧 Change: [specific change to make]
⭐ Confidence: [high/medium/low]
✅ Approve  ❌ Skip
```

### Step 5: Apply (based on mode)

**Read `docs/00-canonical/MODE.json`** to determine the current mode (`light` or `dark`).

**Light mode:** Present proposals, wait for approval
**Dark mode:** Auto-apply high-confidence proposals, queue medium/low for review

### Step 6: Route and Log

Each insight goes to one of two destinations based on what it is:

**Prompt tips** (category: `prompting`) → `.claude/memory/learnings.jsonl`
These are surfaced by the context-enhancer in future sessions. They don't need building.
```json
{
  "ts": "2026-04-01",
  "intent": "external_learning",
  "source": "https://youtube.com/watch?v=xxx",
  "category": "prompting",
  "tip": "When user asks about testing, inject reminder to check HYGIENE.md first",
  "effective": null,
  "pending_validation": true
}
```

**Build proposals** (category: `agents`, `code`, `architecture`, `process`, `security`, `ux`, `meta`) → `.claude/memory/learnings.jsonl`
These are actionable insights that will be surfaced in future sessions via the prompt enhancer.
```json
{
  "id": "PROP-xxx",
  "ts": "2026-04-01T10:00",
  "source": "learner",
  "learning": "Skills should have eval/ folders with binary assertion files",
  "category": "agents",
  "origin": "https://youtube.com/watch?v=xxx",
  "confidence": "high",
  "status": "pending",
  "action": "build"
}
```

**Always log to** `.claude/events/events.jsonl` regardless of destination:
```json
{
  "id": "EVT-xxx",
  "ts": "2026-04-01T10:00",
  "file": "external",
  "change": "Ingested knowledge from [source]",
  "direction": "inbound",
  "trigger": "learner",
  "source": "URL",
  "routed_to": "learnings",
  "propagated": false
}
```

## Proactive Invocation

This skill can be invoked proactively in these situations:

1. **When a bug recurs** — same bug class 3+ times, search for solutions:
   ```
   "Strict mode ref bugs keep recurring. Searching for solutions..."
   → WebSearch "React strict mode useRef useEffect cleanup pattern"
   → /learn:ingest [top result URL]
   → Proposes: add ESLint rule based on learned pattern
   ```

2. **When /eval:automation finds no automation for a rule** — search for how others solve it:
   ```
   "HYGIENE Rule 33 (event wiring) has no linter. Searching..."
   → WebSearch "detect unused custom events JavaScript linter"
   → /learn:ingest [relevant article]
   → Proposes: hook or linter based on technique found
   ```

3. **When user shares a resource in conversation** — auto-detect and offer to learn:
   ```
   User: "I saw this great talk: https://youtube.com/watch?v=xxx"
   → "Want me to learn from this video? I'll extract the transcript and find applicable insights."
   ```

## Examples

### Example 1: Blog Post About Testing Patterns
```
/learner https://kentcdodds.com/blog/testing-implementation-details

📚 Learning: "Test behavior, not implementation. Query by role/label, not class/id."
📖 Source: Kent C. Dodds blog — "The more your tests resemble the way your software is used..."
📍 Apply to: docs/09-agentic-system/retro/03/HYGIENE.md (new rule)
🔧 Change: Add Rule 40: "Tests should assert on user-visible behavior, not internal state"
⭐ Confidence: high
```

### Example 2: YouTube Video on Agent Architecture
```
/learner https://youtube.com/watch?v=dQw4w9WgXcQ "focus on evaluation"

[Extracting transcript via yt-dlp...]
[Cleaning VTT format...]
[Analyzing 4,523 words...]

📚 Learning: "Evaluators should test against golden fixtures, not just acceptance criteria"
📖 Source: YouTube — "Building Reliable AI Agents" at 14:32
📍 Apply to: .claude/agents/evaluator.md
🔧 Change: Add golden fixture comparison step to evaluator protocol
⭐ Confidence: medium
```

### Example 3: Local Research File
```
/learner docs/09-agentic-system/research/03-wrong-kind-of-agent.md

📚 Learning: "Builder agents should be stateless — context via files, not conversation history"
📖 Source: Local research doc, section "The Stateless Builder Hypothesis"
📍 Apply to: .claude/agents/builder.md, AGENT-SYSTEM.md
🔧 Change: Add explicit instruction: "Do not rely on prior conversation. Read files fresh each cycle."
⭐ Confidence: high (internal research, already validated)
```

## Anti-Shortcutting

The learner must not:
- Accept insights at face value without checking relevance
- Apply generic advice that doesn't fit the project (e.g., "use TypeScript" when we already do)
- Log duplicate learnings (check existing memory/learnings.jsonl first)
- Auto-apply low-confidence insights in dark mode (always queue those)

Confidence scoring:
- **High:** Source is authoritative (official docs, established expert), insight directly maps to a known problem
- **Medium:** Source is credible, insight is applicable but needs adaptation
- **Low:** Source is general, insight might apply but needs validation

## Important

- Always cite the source with a specific quote or timestamp
- Never fabricate insights — only extract what's actually in the content
- Deduplicate against existing learnings before logging
- `/learn:self` validates learnings over time (mark `effective: true/false` based on evidence)
- Large content (>10k words) should be chunked and analyzed in sections
