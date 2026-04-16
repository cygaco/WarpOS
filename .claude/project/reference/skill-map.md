# Skill Dependency Map

Generated: 2026-04-04
Skills: 72 across 22 namespaces

## By Namespace

### audit (14 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :agents | — | — | — |
| :architecture | — | — | — |
| :code | /audit:code | — | — |
| :cross | /audit:infra | events.jsonl, learnings.jsonl | — |
| :dependencies | — | — | — |
| :foundation | — | — | — |
| :hooks | — | — | — |
| :infra | — | events.jsonl, learnings.jsonl | — |
| :meta | — | — | — |
| :requirements | — | — | — |
| :security | — | — | — |
| :skills | — | — | — |
| :tooling | — | — | — |
| :update | — | — | — |

### commit (3 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :local | — | — | — |
| :remote | — | — | — |
| :both | /commit:local, /commit:remote | — | — |

### deploy (1 skill)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :push | — | — | — |

### eval (1 skill)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :cascade | — | — | — |

### evolve (3 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :auto | /evolve:scan | — | — |
| :prompting | — | learnings.jsonl | — |
| :scan | — | events.jsonl, learnings.jsonl | — |

### fav (2 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :list | — | — | — |
| :search | — | — | — |

### fix (2 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :fast | /reasoning:log | learnings.jsonl, traces.jsonl | traces.jsonl, learnings.jsonl |
| :deep | /reasoning:log | learnings.jsonl, traces.jsonl | traces.jsonl, learnings.jsonl |

### hooks (5 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :add | — | — | — |
| :disable | — | — | — |
| :friction | — | — | — |
| :sync | — | — | — |
| :test | — | — | — |

### learn (2 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :ingest | — | events.jsonl, learnings.jsonl | learnings.jsonl, events.jsonl |
| :self | — | learnings.jsonl, modifications.jsonl | learnings.jsonl |

### preflight (8 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :agent-buildability | — | — | — |
| :architecture | — | — | — |
| :environment | — | — | — |
| :requirements-consistency | — | — | — |
| :requirements-coverage | — | — | — |
| :run-transition | — | — | — |
| :skeleton | — | — | — |
| :update | — | — | — |

### reasoning (3 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :classify | /fix:deep, /fix:fast | learnings.jsonl, traces.jsonl | — |
| :log | — | traces.jsonl | traces.jsonl |
| :score | — | learnings.jsonl, traces.jsonl | traces.jsonl, learnings.jsonl |

Reference: `.claude/reference/reasoning-frameworks.md`

### reconcile (2 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :scan | — | — | — |
| :fix | /reconcile:scan | — | — |

### research (2 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :simple | — | learnings.jsonl | learnings.jsonl |
| :deep | — | learnings.jsonl | learnings.jsonl |

### retro (4 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :full | /retro:code, /retro:git | — | — |
| :meta | — | — | — |
| :code | — | — | — |
| :git | — | — | — |

### session (4 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :handoff | — | — | — |
| :checkpoint | — | — | — |
| :history | — | — | — |
| :resume | — | — | — |

### skills (5 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :create | — | — | — |
| :edit | — | systems.jsonl | systems.jsonl |
| :delete | — | systems.jsonl, traces.jsonl | — |
| :cleanup | /skills:map | learnings.jsonl, systems.jsonl | — |
| :map | — | — | skill-map.md |

### sleep (3 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :quick | — | learnings.jsonl | learnings.jsonl |
| :dream | — | — | — |
| :deep | /reasoning:score, /skills:create | events.jsonl, learnings.jsonl, traces.jsonl | learnings.jsonl, .sleep-journal.md, .sleep-coaching.md, .sleep-dreams.md |

### status (2 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :system | — | learnings.jsonl, modifications.jsonl, systems.jsonl, traces.jsonl | — |
| :project | — | — | — |

### step (1 skill)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :goto | — | — | — |

### threads (2 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :write | — | inbox.jsonl | inbox.jsonl |
| :read | — | inbox.jsonl | — |

### wakeup (2 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :quick | — | — | — |
| :dreams | — | — | — |

### warp (3 skills)

| Skill | Calls | Reads | Writes |
|-------|-------|-------|--------|
| :init | — | — | — |
| :check | — | — | — |
| :sync | — | — | — |

## Orphans (no inbound or outbound skill-to-skill references)

- /deploy:push — standalone
- /eval:cascade — standalone
- /fav:list, /fav:search — standalone pair
- /hooks:add, :disable, :friction, :sync, :test — standalone namespace
- /step:goto — standalone
- /status:project — standalone
- /wakeup:quick, :dreams — standalone pair
- /warp:init, :check, :sync — standalone namespace (dormant, for cross-product)
- /preflight:* (8 skills) — standalone namespace (dormant, for agent runs)

## Clusters (tightly connected groups)

- **reasoning**: classify → (routes to) fix:fast/fix:deep → log → score
- **commit**: both → local + remote
- **sleep**: deep calls reasoning:score + skills:create, reads/writes everything
- **learn**: ingest + self both read/write learnings.jsonl
- **skills**: cleanup → map, delete/edit check systems.jsonl
- **retro**: full → code + git, meta standalone
- **evolve**: auto → scan, prompting standalone
- **reconcile**: fix → scan

## Data Flow

| Data Store | Writers | Readers |
|------------|---------|---------|
| learnings.jsonl | /sleep:deep, /sleep:quick, /learn:self, /learn:ingest, /fix:deep, /fix:fast, /research:simple, /research:deep, /reasoning:score | /reasoning:run, /evolve:scan, /evolve:prompting, /audit:cross, /audit:infra, /status:system, /skills:cleanup |
| traces.jsonl | /reasoning:log, /fix:deep, /fix:fast | /reasoning:run, /reasoning:score, /sleep:deep, /status:system, /skills:delete |
| modifications.jsonl | systems-sync.js (auto) | /learn:self, /status:system |
| systems.jsonl | systems-sync.js (auto), /sleep:deep | /skills:edit, /skills:delete, /skills:cleanup, /status:system |
| inbox.jsonl | session-stop.js (auto), systems-sync.js (auto), /threads:write | /threads:read, context-enhancer.js |
| events.jsonl | pulse-core.js (auto), /learn:ingest | /evolve:scan, /learn:ingest, /sleep:deep, /audit:cross, /audit:infra |
| skill-map.md | /skills:map | /skills:cleanup, /skills:delete |
