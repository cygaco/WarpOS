#!/usr/bin/env node
"use strict";

/**
 * scripts/epic/plan.js — `/epic:plan` backing logic (S-LC-09, Wave 3 of
 * E-LIFECYCLE-001). The epic equivalent of `scripts/sprint/plan.js`.
 *
 * Given a STRUCTURED payload (the /epic:plan skill body does the plain-language
 * reasoning and emits the fields; this script is dumb, deterministic plumbing),
 * it produces TWO durable artifacts:
 *
 *   1. A validate-shape epic file at  trackers/epics/<E-id>-<slug>.md
 *      — carries all 10 frontmatter bullets + all 14 H2 sections, matching
 *        trackers/templates/EPIC_TEMPLATE.md and the E-LIFECYCLE-001 epic file.
 *   2. A companion plan at            _planning/epics/<E-id>.md
 *      — the durable plan artifact (AC + sprint candidates + dependency/risk
 *        maps) carrying a tracker-linkage pointer back to the epic file.
 *
 * The epic file points to the plan; the plan points to the epic file. That
 * round-trip linkage is the convention S-LC-08 formalizes in _planning/README.md
 * (this script only REFERENCES _planning/epics/ as a path; it mkdir-p's the dir
 * defensively but does NOT author the dir README/contract — that is S-LC-08's).
 *
 * DISCIPLINE:
 *   - Idempotent + read-before-write: refuses to clobber an existing epic file
 *     unless --force. Content is deterministic given the payload (uses
 *     payload.date, never Date.now()) so a re-run with the same payload + --force
 *     reproduces byte-identical files.
 *   - PURE core (buildEpic) with every seam in the payload — no fs, no cwd — so
 *     the regression suite bite-tests it directly.
 *
 * Usage:
 *   node scripts/epic/plan.js --payload <json-file> [--force] [--dry-run]
 *
 * Exit codes:
 *   0  both artifacts written (or dry-run OK)
 *   1  payload load / validation failed
 *   2  bad usage
 *   3  epic file already exists and --force not given (read-before-write guard)
 */

const fs = require("fs");
const path = require("path");
const {
  slugify,
  isValidEpicId,
  verifyEpicMarkdown,
} = require("./lib");
// Single source for the 20 enforcement-criteria categories (S-LC-11, PLAN §11).
const {
  categoryChecklistMarkdown,
  stripCategoryChecklist,
} = require("../sprint/ac-categories");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");

// ── PURE markdown builders ────────────────────────────────────────────────────

function asList(items, empty = "- None currently recorded.") {
  const arr = (items || []).filter((x) => x != null && String(x).trim());
  if (!arr.length) return empty;
  return arr.map((x) => `- ${String(x).trim()}`).join("\n");
}

const AC_EMPTY = "- None recorded yet — fill from the 20-category checklist below.";

/**
 * Render the § Acceptance criteria body. Strips any pre-existing
 * marker-delimited category checklist from the incoming AC FIRST, so the fresh
 * `categoryChecklistMarkdown()` appended below is the ONLY checklist in the
 * artifact (S-LC-11 idempotency: a round-trip parse→regenerate or a `--force`
 * re-emit must NOT duplicate the 20-category section). Accepts an AC array
 * (normal case) or a pre-rendered AC section string (round-trip case). PURE.
 */
function renderAcceptanceCriteria(ac) {
  const rendered = typeof ac === "string" ? ac : asList(ac, AC_EMPTY);
  const stripped = stripCategoryChecklist(rendered);
  const body = String(stripped == null ? "" : stripped).trim();
  return body || AC_EMPTY;
}

function asText(v, fallback = "TBD") {
  if (v == null) return fallback;
  if (Array.isArray(v)) return v.filter(Boolean).map((x) => String(x).trim()).join("; ") || fallback;
  const s = String(v).trim();
  return s || fallback;
}

function dodList(items) {
  const arr = (items || []).filter((x) => x != null && String(x).trim());
  // DoD items are checkboxes; an empty DoD is a hard gap (verify will flag the blank section).
  return arr.map((x) => `- [ ] ${String(x).trim()}`).join("\n");
}

function decisionsList(decisions) {
  const arr = decisions || [];
  if (!arr.length) return "- None currently recorded.";
  return arr
    .map((d) => {
      if (typeof d === "string") return `- ${d.trim()}`;
      const date = (d.date || "").trim();
      const text = (d.text || d.decision || "").trim();
      return `- ${date ? date + " — " : ""}${text}`;
    })
    .filter(Boolean)
    .join("\n");
}

function sprintList(sprints) {
  const arr = sprints || [];
  if (!arr.length) return "- None currently recorded — minted via `/sprint:plan` at execution.";
  return arr
    .map((s) => {
      if (typeof s === "string") return `- ${s.trim()}`;
      const id = (s.id || "").trim();
      const goal = (s.goal || "").trim();
      const state = (s.state || "Planned").trim();
      return `- **${id || "S-TBD"}** — ${state} — ${goal || "TBD"}`;
    })
    .join("\n");
}

/**
 * Build the epic-tracker markdown. PURE. The resulting file is parsed by the
 * SAME splitSections the validator uses, and carries every required section.
 */
function buildEpicMarkdown(p) {
  const epicId = p.epicId;
  const slug = p.slug || slugify(p.title || epicId);
  const epicFileBase = `${epicId}-${slug}.md`;
  const planRel = `../../_planning/epics/${epicId}.md`;
  const date = p.date || "TBD-DATE";
  const owner = asText(p.owner, "President Agent");
  const state = asText(p.state, "Planned");
  const percent = p.percent == null ? 0 : p.percent;
  const sessionId = asText(p.sessionId, "n/a");
  const agent = asText(p.agent, "Alex");

  return `<!-- EPIC TRACKER — generated by /epic:plan (scripts/epic/plan.js).
     Linked from ../../ROADMAP.md § Epics and ../../TRACKER.md.
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# ${epicId} — ${asText(p.title, epicId)}

- **Epic label and number:** ${epicId}
- **Title:** ${asText(p.title, epicId)}
- **Owner:** ${owner}
- **Parent roadmap area:** ${asText(p.roadmapArea, "[ROADMAP.md § Epics](../../ROADMAP.md)")}
- **Goal:** ${asText(p.goal)}
- **Background:** ${asText(p.background)} Plan artifact: [${planRel}](${planRel}).
- **Scope:** ${asText(p.scope)}
- **Out of scope:** ${asText(p.outOfScope, "None recorded.")}
- **Current state:** ${state}
- **Percent completion:** ${percent}% — ${asText(p.percentRationale, "conservative; plan authored, no sprints landed.")}

## Definition of Done
${dodList(p.definitionOfDone)}

## Related definitions
${asList(p.relatedDefinitions, "- None currently recorded.")}

## Related sprints
${sprintList(p.sprintCandidates)}

## Dependencies
${asList(p.dependencies)}

## Blockers
${asList(p.blockers, "- None currently recorded.")}

## Risks
${asList(p.risks)}

## Decisions
${decisionsList(p.decisions)}

## Open questions
${asList(p.openQuestions, "- None currently recorded.")}

## Session log
### ${date} — Session ${sessionId}
- Agent(s): ${agent} · Mode: ${asText(p.mode, "sprint")}
- Work performed: authored ${epicId} via /epic:plan (epic file + companion plan ${planRel}).
- Files changed: trackers/epics/${epicFileBase}, _planning/epics/${epicId}.md · Paths changed: created the epic tracker file · Wirings changed: pending ROADMAP § Epics + TRACKER reconciliation (α at integration).
- Decisions: see § Decisions · Issues discovered: None recorded at plan time.
- Definitions added/changed: None.
- State change: (new) → ${state} · Completion change: — → ${percent}%
- Verification performed: section-completeness self-check (verifyEpicMarkdown) · Validation run: node scripts/trackers/validate.js (post-wiring, α) · Validation result: pending wiring.
- Next action: see § Current next action.
- Evidence/references: ${planRel}.

## Change log
### ${date} — Session ${sessionId}
- Changed: created ${epicId} (epic file + companion plan artifact) from the /epic:plan payload.
- Reason: ${asText(p.changeReason, "operator directed planning this epic via /epic:plan.")}
- Affected: trackers/epics/${epicFileBase} (new), _planning/epics/${epicId}.md (new); pending ROADMAP § Epics + TRACKER header (α integration).
- Previous state: not tracked.
- New state: ${state}, ${percent}%, plan authored.

## Evidence log
### ${date} — Epic plan authored
- Evidence type: File changed.
- Detail/location: trackers/epics/${epicFileBase}; _planning/epics/${epicId}.md.
- Verified by: ${agent} · Supports: § Definition of Done scoping (the plan exists + links round-trip).

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| _planning/epics/${epicId}.md (plan artifact) | Yes | Verified Exists | _planning/epics/ | written by /epic:plan | ${date} | ${agent} |
| ROADMAP § Epics entry for ${epicId} | Yes | Missing But Required | ROADMAP.md | pending α integration | ${date} | ${agent} |

## Current next action
${asText(p.nextAction, `Mint the Wave-0 sprint candidate(s) via /sprint:plan, then wire ${epicId} into ROADMAP § Epics + the TRACKER header (α at integration).`)}

## Completion record
- Final state: Not yet complete.
- Percent completion: n/a
- Completion timestamp: n/a
- Definition of done used: the § Definition of Done above.
- Evidence of completion: n/a (${state}).
- Session IDs / dates / agents: n/a.
- Related completed sprints: None.
- Remaining follow-up items: all sprint candidates listed in § Related sprints.
- Related untracked work: None.
- ../../TRACKER.md updated: No (pending α integration) · Roadmap reconciled: No (pending α integration).
`;
}

/**
 * Build the companion plan artifact (_planning/epics/<E-id>.md). PURE. Carries
 * the tracker-linkage pointer BACK to the epic file plus the richer planning
 * detail (AC + sprint candidates + dependency/risk maps) the epic file summarizes.
 */
function buildPlanMarkdown(p) {
  const epicId = p.epicId;
  const slug = p.slug || slugify(p.title || epicId);
  const epicRel = `../../trackers/epics/${epicId}-${slug}.md`;
  const date = p.date || "TBD-DATE";

  return `# Epic Plan: ${asText(p.title, epicId)}

> **Epic ID:** \`${epicId}\`
> **Epic tracker (source of truth for state):** [${epicRel}](${epicRel})
> **Status:** ${asText(p.state, "Planned")} — this document is the durable plan artifact; \`TRACKER.md\` outranks it for state.
> **Generated by:** \`/epic:plan\` (scripts/epic/plan.js) on ${date}.
> **Tracker linkage:** \`trackers/epics/${epicId}-${slug}.md\` ⇄ \`_planning/epics/${epicId}.md\` (round-trip).

## 1. Goal
${asText(p.goal)}

## 2. Background
${asText(p.background)}

## 3. Scope
${asText(p.scope)}

### Out of scope
${asText(p.outOfScope, "None recorded.")}

## 4. Acceptance criteria
${renderAcceptanceCriteria(p.acceptanceCriteria)}

${categoryChecklistMarkdown()}

## 5. Sprint candidates
${sprintList(p.sprintCandidates)}

## 6. Dependency map
${asList(p.dependencyMap || p.dependencies)}

## 7. Risk map
${asList(p.riskMap || p.risks)}

## 8. Required agents / modes / team / lifecycle hooks
- **Required agents:** ${asText(p.requiredAgents, "per /sprint:plan at execution.")}
- **Required modes:** ${asText(p.requiredModes, "sprint (full lifecycle).")}
- **Required persistent-team behavior:** ${asText(p.teamBehavior, "α+ε+β per the mode-lifecycle registry.")}
- **Required lifecycle hooks:** ${asText(p.lifecycleHooks, "the mode:init:gate + virtual-event registry (Wave 0/1).")}

## 9. Tracker linkage
- Epic tracker: [${epicRel}](${epicRel}) — authoritative state.
- ROADMAP § Epics entry: pending α integration.
- TRACKER header pointer: pending α integration.

## 10. Execution-phase gates + human approval points
${asList(p.executionGates, "- Standard sprint gauntlet gates apply; no epic-specific gates recorded.")}

### Human approval points
${asList(p.approvalPoints, "- None recorded.")}

## 11. Blast-radius analysis
${asList(p.blastRadius, "- To be completed at /sprint:design for each sprint candidate.")}

---
_End of plan artifact for ${epicId}. State lives in the epic tracker; this is the durable plan._
`;
}

/**
 * PURE assembly: build both artifacts + their paths + the linkage facts. No fs.
 * Returns { ok, errors[], epicId, slug, epic, plan, epicPath, planPath,
 *           epicAbs, planAbs, verify, linkage }.
 */
function buildEpic(payload, root = ROOT) {
  const errors = [];
  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: ["payload missing or not an object"] };
  }
  const epicId = String(payload.epicId || "").trim();
  if (!epicId) errors.push("epicId is required");
  else if (!isValidEpicId(epicId)) errors.push(`epicId "${epicId}" is malformed (expect E-SEGMENT-###)`);
  if (!payload.title || !String(payload.title).trim()) errors.push("title is required");
  const dod = (payload.definitionOfDone || []).filter((x) => x != null && String(x).trim());
  if (!dod.length) errors.push("definitionOfDone must have at least one item (empty DoD = a blank required section)");

  const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title || epicId);
  const epicPath = path.join("trackers", "epics", `${epicId}-${slug}.md`);
  const planPath = path.join("_planning", "epics", `${epicId}.md`);

  if (errors.length) return { ok: false, errors, epicId, slug, epicPath, planPath };

  const epic = buildEpicMarkdown({ ...payload, epicId, slug });
  const plan = buildPlanMarkdown({ ...payload, epicId, slug });
  const verify = verifyEpicMarkdown(epic);

  // Linkage facts: the epic file names the plan path; the plan names the epic file.
  const linkage = {
    epicPointsToPlan: epic.includes(`_planning/epics/${epicId}.md`),
    planPointsToEpic: plan.includes(`trackers/epics/${epicId}-${slug}.md`),
  };

  return {
    ok: verify.ok && linkage.epicPointsToPlan && linkage.planPointsToEpic,
    errors: verify.ok ? [] : verify.missing.concat(verify.blank.map((b) => `blank section: ${b}`)),
    epicId,
    slug,
    epic,
    plan,
    epicPath,
    planPath,
    epicAbs: path.join(root, epicPath),
    planAbs: path.join(root, planPath),
    verify,
    linkage,
  };
}

// ── Thin CLI (read-before-write) ──────────────────────────────────────────────

function parseArgs(argv) {
  const out = { payload: null, force: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--payload") out.payload = argv[++i];
    else if (a === "--force") out.force = true;
    else if (a === "--dry-run") out.dryRun = true;
  }
  return out;
}

function loadPayload(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    process.stderr.write(`/epic:plan — cannot load payload: ${err.message}\n`);
    return null;
  }
}

function run(argv, root = ROOT) {
  const args = parseArgs(argv);
  if (!args.payload) {
    process.stderr.write("usage: node scripts/epic/plan.js --payload <json-file> [--force] [--dry-run]\n");
    return 2;
  }
  const payload = loadPayload(args.payload);
  if (!payload) return 1;

  const built = buildEpic(payload, root);
  if (!built.ok) {
    process.stderr.write(`/epic:plan — refusing: epic is not section-complete:\n  - ${(built.errors || []).join("\n  - ")}\n`);
    return 1;
  }

  // Read-before-write: never clobber an existing epic file without --force.
  if (fs.existsSync(built.epicAbs) && !args.force) {
    process.stderr.write(
      `/epic:plan — epic file already exists: ${built.epicPath}\n` +
        `  re-run with --force to overwrite (idempotent: same payload reproduces identical content).\n`,
    );
    return 3;
  }

  if (args.dryRun) {
    process.stdout.write(
      JSON.stringify({ ok: true, dryRun: true, epic: built.epicPath, plan: built.planPath, verify: built.verify }, null, 2) + "\n",
    );
    return 0;
  }

  fs.mkdirSync(path.dirname(built.epicAbs), { recursive: true });
  fs.mkdirSync(path.dirname(built.planAbs), { recursive: true }); // defensive mkdir-p of _planning/epics/
  fs.writeFileSync(built.epicAbs, built.epic, "utf8");
  fs.writeFileSync(built.planAbs, built.plan, "utf8");

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        epicId: built.epicId,
        epic: built.epicPath,
        plan: built.planPath,
        sections_complete: built.verify.ok,
        linkage: built.linkage,
      },
      null,
      2,
    ) + "\n",
  );
  return 0;
}

module.exports = {
  buildEpic,
  buildEpicMarkdown,
  buildPlanMarkdown,
  parseArgs,
  run,
  ROOT,
};

if (require.main === module) {
  process.exit(run(process.argv));
}
