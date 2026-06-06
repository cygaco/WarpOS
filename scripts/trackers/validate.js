#!/usr/bin/env node
"use strict";

/**
 * scripts/trackers/validate.js — fail-closed validator for the enforced
 * tracker system (agentic_os_tracker_system_improvements.md, esp. §28.7
 * Validation Enforcement). It refuses the "tracker drifted from reality" /
 * "tracker lies about state" failure classes the spec exists to prevent:
 * a missing required section, a blank section that hides ambiguity, a broken
 * intra-repo link, an active item with no next action, a completed item with
 * no evidence or below 100%, a 100% item not marked done, a sprint with no
 * parent epic, ambiguous "probably done" language (§21), and undefined
 * operational terms used without a §8 definition.
 *
 * ARCHITECTURE (matches scripts/checks/*.js house style):
 *   - A PURE evaluate({ tracker, trackerFiles, links, paths }) core with every
 *     seam INJECTED (no fs, no cwd) so the in-file bite-test can fire every
 *     named check both PASS and FAIL on synthetic input. The bug-prone parsing
 *     + reconciliation lives here.
 *   - A thin run()/main() that reads the real tree (rooted at the canonical
 *     repo, NOT cwd — cwd may be a stale worktree) and feeds evaluate().
 *
 * NAMED CHECKS (each → {check, status: PASS|FAIL, details[]}):
 *   (a) sections-present     — TRACKER.md has all 34 §5 sections.
 *   (b) no-blank-section     — every required section has content or the
 *                              explicit "None currently recorded." sentinel.
 *   (c) broken-links         — every intra-repo link target in TRACKER.md exists.
 *   (d) active-tracker-files  — active epics/sprints link to an existing
 *                              /trackers/ file.
 *   (e) active-next-action   — every active item names a next action.
 *   (f) completed-evidence   — every completed item records evidence.
 *   (g) completed-100        — every completed item is 100%.
 *   (h) hundred-completed    — every 100% item is marked completed.
 *   (i) sprint-parent-epic   — every sprint names a parent epic.
 *   (j) ambiguous-language   — no §21 prohibited ambiguous-state phrase appears.
 *   (k) undefined-terms      — no core operational term is used but absent from
 *                              the §8 Definitions section.
 *   (l) required-paths       — the §33 required files/dirs/templates exist.
 *
 * FAIL-CLOSED CONTRACT:
 *   - evaluate() returns a structured result; it NEVER throws on malformed
 *     tracker content — malformed input surfaces as a FAIL, never a silent pass.
 *   - A genuine runner/parse error (unreadable required input, internal throw)
 *     exits 2 (NOT a pass), and the JSON carries fatal:true.
 *   - Exit 0 = all checks pass · 1 = at least one check FAILed · 2 = usage /
 *     runner error. A validator that errors must never read green.
 *
 *   node scripts/trackers/validate.js            # human-readable report
 *   node scripts/trackers/validate.js --json      # machine-readable
 *   node scripts/trackers/validate.js --selftest   # run the in-file bite-test
 */

const fs = require("fs");
const path = require("path");

const NAME = "trackers/validate";
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");

// ── §5: the 34 required TRACKER.md sections (in spec order) ───────────────────
const REQUIRED_SECTIONS = [
  "Header",
  "How to Use This Document",
  "Authority and Conflict Resolution",
  "Definitions",
  "System Inventory",
  "Verification Matrix",
  "Active Epics",
  "Active Sprints",
  "Planned but Not Started Epics",
  "Planned but Not Started Sprints",
  "Completed Epics",
  "Completed Sprints",
  "Cancelled or Superseded Work",
  "Untracked Work",
  "State Model",
  "Percent Completion Rules",
  "Language Rules",
  "Update Triggers",
  "Enforcement Requirements",
  "Validation Requirements",
  "Roadmap Rules",
  "Epic Tracker Rules",
  "Sprint Tracker Rules",
  "Session Logging Rules",
  "Change Tracking Rules",
  "Evidence Rules",
  "Definition of Done",
  "Reconciliation Rules",
  "Required Files",
  "Required Wirings",
  "Required Templates",
  "Implementation Priority",
  "Non-Negotiable Requirements",
  "Known Gaps and Open Flaws",
];

// The explicit empty-section sentinel the spec mandates (§5). A precise
// equivalent is also accepted so the check isn't brittle to phrasing.
const EMPTY_SENTINEL_RE = /none\s+currently\s+recorded\.?|no\s+(known\s+)?(entries|items|gaps)\s+currently\s+recorded\.?/i;

// §21 prohibited ambiguous-state phrases. Each is a state-safety hazard: it
// hides whether work is actually done/verified. Matched case-insensitively.
const AMBIGUOUS_PHRASES = [
  "likely done",
  "probably complete",
  "probably done",
  "mostly handled",
  "mostly done",
  "should be fine",
  "seems done",
  "seems complete",
  "basically finished",
  "basically done",
  "we can assume this is complete",
  "assume this is complete",
  "no need to track",
  "memory has it",
  "done unless something comes up",
  "this is obvious",
  "does not need a definition",
  "the agent will know what this means",
  "path should exist",
  "probably wired",
  "looks wired enough",
  "validation should pass",
];

// §8: the core operational terms that MUST carry a definition in the Definitions
// section once they are used operationally. A representative, high-signal subset
// of the §8 list — the terms whose absence most directly breaks state/authority
// reasoning. (We only flag a term that is actually USED in the tracker body but
// MISSING from Definitions, so this never demands unused vocabulary.)
const CORE_TERMS = [
  "Epic",
  "Sprint",
  "Task",
  "Tracker",
  "Source of truth",
  "State",
  "Percent completion",
  "Completion",
  "Verification",
  "Evidence",
  "Blocker",
  "Dependency",
  "Scope",
  "Change log",
  "Session log",
  "Untracked work",
  "Reconciliation",
  "Superseded",
  "Cancelled",
  "Next action",
  "Definition of done",
  "System Inventory",
  "Verification Matrix",
  "Wiring",
  "Validator",
  "Template",
  "Path",
  "Known gap",
  "Agentic OS",
];

// §33: required files, directories, and templates. dirs end with "/".
const REQUIRED_PATHS = [
  "TRACKER.md",
  "ROADMAP.md",
  "UNTRACKED_WORK.md",
  "trackers/",
  "trackers/epics/",
  "trackers/sprints/",
  "trackers/templates/",
  "trackers/templates/EPIC_TEMPLATE.md",
  "trackers/templates/SPRINT_TEMPLATE.md",
  "trackers/templates/SESSION_LOG_TEMPLATE.md",
  "trackers/templates/UNTRACKED_WORK_TEMPLATE.md",
  "trackers/templates/DEFINITION_TEMPLATE.md",
  "trackers/templates/CHANGE_LOG_TEMPLATE.md",
  "trackers/templates/EVIDENCE_LOG_TEMPLATE.md",
  "trackers/templates/VERIFICATION_TEMPLATE.md",
  "trackers/templates/RECONCILIATION_TEMPLATE.md",
];

// ── Parsing helpers (pure) ────────────────────────────────────────────────────

/** Heading text (sans leading #'s, list numbers, backticks, trailing punctuation). */
function normHeading(line) {
  return line
    .replace(/^#+\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[`*_]/g, "")
    .trim()
    .toLowerCase();
}

/** Does a heading text match a required section name (tolerant of extra words/numbers)? */
function headingMatchesSection(headingText, section) {
  const h = headingText;
  const s = section.toLowerCase();
  return h === s || h.startsWith(s) || h.includes(s);
}

/**
 * The spec's "Header" section is NOT a literal `# Header` heading — it is the
 * document-title H1 (`# TRACKER.md`) followed by the Version / Owner / Authority
 * block. Identify it as the FIRST H1 section that carries that title block:
 * a Version line AND an Owner line AND an Authority line in its body. This keeps
 * the check rigorous (a doc missing the version/owner/authority block still
 * FAILs "Header") rather than blindly mapping the first heading.
 */
function isHeaderSection(s) {
  if (!s || s.level !== 1) return false;
  const ht = s.headingText || "";
  const titleLike = ht === "tracker.md" || /tracker/.test(ht);
  const body = (s.body || "");
  const hasVersion = /(^|\n)\s*version\s*[:：]/i.test(body);
  const hasOwner = /(^|\n)\s*owner\s*[:：]/i.test(body);
  const hasAuthority = /(^|\n)\s*authority\s*[:：]/i.test(body);
  return titleLike && hasVersion && hasOwner && hasAuthority;
}

/** Find the section matching a required §5 name, mapping "Header" to the title block. */
function findRequiredSection(sections, section) {
  if (section === "Header") return sections.find(isHeaderSection);
  return sections.find((s) => headingMatchesSection(s.headingText, section));
}

/** Heading level (number of leading #'s) of an ATX heading line, or 0 if not a heading. */
function headingLevel(line) {
  const m = /^(#{1,6})\s+/.exec(line);
  return m ? m[1].length : 0;
}

/**
 * Split a markdown doc into sections by ATX headings.
 *
 * The 34 required §5 sections of TRACKER.md are H1 headings (`# Active Epics`,
 * `# Definitions`, ...), and their CONTENT lives in H2/H3 subsections
 * (`## Definition: <Term>`, `### <LABEL>`). So to treat each required section's
 * body as INCLUDING its subsections, split at a single boundary level (default
 * H1): a heading at `boundaryLevel` opens a new section and EVERYTHING below it
 * (including deeper headings) is part of that section's body until the next
 * heading at `boundaryLevel`.
 *
 * Returns [{ heading, headingText, level, body }]. body excludes the opening
 * heading line but KEEPS nested sub-headings verbatim. Pure + total: any string
 * parses (never throws). Content before the first boundary heading is dropped
 * (there is none in a well-formed tracker — the doc opens with `# TRACKER.md`).
 *
 * @param {string} md
 * @param {number} [boundaryLevel=1]  heading level that delimits sections.
 */
function splitSections(md, boundaryLevel = 1) {
  const lines = String(md == null ? "" : md).split(/\r?\n/);
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const lvl = headingLevel(line);
    if (lvl > 0 && lvl <= boundaryLevel) {
      if (cur) sections.push(cur);
      cur = { heading: line, headingText: normHeading(line), level: lvl, bodyLines: [] };
    } else if (cur) {
      cur.bodyLines.push(line);
    }
  }
  if (cur) sections.push(cur);
  return sections.map((s) => ({
    heading: s.heading,
    headingText: s.headingText,
    level: s.level,
    body: s.bodyLines.join("\n").trim(),
  }));
}

/** Body has real content if it is non-empty OR carries the explicit empty sentinel. */
function sectionHasContent(body) {
  const stripped = body.replace(/^[->\s*]+$/gm, "").trim();
  if (stripped.length > 0) return true;
  return EMPTY_SENTINEL_RE.test(body);
}

/** All intra-repo markdown link targets `[text](target)` — drops external + anchors. */
function extractLinks(md) {
  const out = [];
  const text = String(md == null ? "" : md);
  for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = m[1].trim();
    if (!target) continue;
    if (/^(https?:|mailto:|#|tel:)/i.test(target)) continue; // external / anchor-only
    target = target.split("#")[0].split("?")[0].trim(); // drop anchor/query
    if (!target) continue;
    out.push(target);
  }
  return out;
}

// The §5 state sections that hold epic/sprint ITEMS, and what each implies for
// an item parsed from inside it. `kind` and the default `state` come from the
// CONTAINING section (item labels like `T1`/`E1`/`E-ADR0007` do NOT encode
// kind/state); an explicit `Current state:`/`Final state:` field overrides it.
const ITEM_SECTIONS = [
  { name: "Active Epics", kind: "epic", defaultState: "Active" },
  { name: "Active Sprints", kind: "sprint", defaultState: "Active" },
  { name: "Planned but Not Started Epics", kind: "epic", defaultState: "Planned" },
  { name: "Planned but Not Started Sprints", kind: "sprint", defaultState: "Planned" },
  { name: "Completed Epics", kind: "epic", defaultState: "Completed" },
  { name: "Completed Sprints", kind: "sprint", defaultState: "Completed" },
];

/**
 * Parse tracker items.
 *
 * Items live ONLY inside the Active/Planned/Completed Epics/Sprints H1 sections,
 * ONE item per `### <LABEL>` H3 subsection (e.g. `### E-TRACKER-001 — ...`,
 * `### T1 — ...`). Prose, definitions (`## Definition:`), tables, and inventory
 * rows are NEVER items — the parser only ever descends into the six item
 * sections and only treats H3 headings there as item boundaries.
 *
 * For each item: `kind` and the default `state` come from the containing section
 * (per ITEM_SECTIONS); the bulleted fields below the H3 fill the rest:
 *   - Current state / Final state / State            → state (overrides default)
 *   - Percent completion / Percent / Completion      → percent
 *   - Next required action / Next action / Proposed first action → nextAction
 *   - Evidence of progress / Evidence of completion / Evidence  → evidence
 *   - Parent epic                                    → parentEpic
 *   - Link to epic/sprint tracker / Link            → trackerLink
 * A `Parent epic: <X>` written INLINE inside another bullet (e.g. on the Evidence
 * line of completed E1–E8) is also picked up.
 *
 * evaluate() still accepts items DIRECTLY via the injected `tracker.items` seam
 * for bite-testing; the FS main builds the array from disk with parseItems().
 *
 * Item shape: { kind:"epic"|"sprint", label, state, percent(number|null),
 *               nextAction(string|""), evidence(string|""), parentEpic(string|""),
 *               trackerLink(string|"") }
 */
function parseItems(md) {
  const items = [];
  // Split at H1 so each state section's body includes its `### <LABEL>` items.
  const sections = splitSections(md, 1);
  for (const sec of sections) {
    const spec = ITEM_SECTIONS.find((s) =>
      headingMatchesSection(sec.headingText, s.name)
    );
    if (!spec) continue;
    for (const it of parseItemsFromSection(sec.body, spec)) items.push(it);
  }
  return items;
}

/** Extract one item per `### <LABEL>` H3 from a state-section body. */
function parseItemsFromSection(body, spec) {
  const out = [];
  // Split the section body at H3 boundaries (the item delimiter). Anything
  // before the first H3 is section preamble (prose), never an item.
  const subs = splitSections(body, 3).filter((s) => s.level === 3);
  for (const sub of subs) {
    const label = itemLabel(sub.headingText, sub.heading);
    const item = {
      kind: spec.kind,
      label,
      state: spec.defaultState,
      percent: null,
      nextAction: "",
      evidence: "",
      parentEpic: "",
      trackerLink: "",
    };
    applyItemFields(item, sub.body);
    out.push(item);
  }
  return out;
}

/** Pull a short, stable label from an item H3 heading (the part before " — "/"·"). */
function itemLabel(headingText, headingRaw) {
  // headingText is normalized+lowercased; prefer the raw heading for casing.
  const raw = String(headingRaw || "")
    .replace(/^#+\s*/, "")
    .trim();
  const head = raw.split(/\s+[—–·-]\s+/)[0].trim() || raw;
  return head || headingText;
}

/** Read the bulleted fields of one item body into the item object. */
function applyItemFields(item, body) {
  const lines = String(body == null ? "" : body).split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    // A field bullet is `- <Label>: <value>`. Take the label as everything from
    // the bullet to the FIRST colon, then classify it by its leading keyword.
    // This is robust to parenthetical qualifiers ("Evidence of completion
    // (per the interim tracker, verified ...): ...") whose inner punctuation
    // would break a strict label charclass.
    const kv = line.match(/^[-*]\s*(\*\*)?\s*([^:：]+?)\s*(\*\*)?\s*[:：]\s*(.*)$/);
    if (kv) {
      const key = normFieldKey(kv[2]);
      const val = kv[4].trim();
      const field = classifyField(key);
      if (field === "state") item.state = val;
      else if (field === "percent") item.percent = parsePercent(val);
      else if (field === "nextAction") item.nextAction = val;
      else if (field === "evidence") item.evidence = val;
      else if (field === "parentEpic") item.parentEpic = val;
      else if (field === "link") {
        item.trackerLink = extractFieldLink(line, val);
      }
    }
    // A `Parent epic: <X>` written inline inside another bullet (e.g. the
    // Evidence line of completed E1–E8) still names the parent epic.
    if (!item.parentEpic) {
      const inlineParent = line.match(/parent epic\s*[:：]\s*([^.;]+)/i);
      if (inlineParent) item.parentEpic = inlineParent[1].trim();
    }
    // First intra-repo link anywhere in the item body, if no explicit one yet.
    if (!item.trackerLink) {
      const inlineLink = extractLinks(raw)[0];
      if (inlineLink) item.trackerLink = inlineLink;
    }
  }
}

/**
 * Resolve the tracker-file target of a `Link to ... tracker:` bullet to a clean
 * path. Prefers a markdown `[text](target)` link; else a backtick-quoted path
 * (the tracker's form: `` `/trackers/epics/...md` — Missing But Required ``);
 * else the first whitespace-delimited token of the value. This strips trailing
 * prose so the path can be probed for existence honestly.
 */
function extractFieldLink(line, val) {
  const md = extractLinks(line)[0];
  if (md) return md;
  const tick = String(val).match(/`([^`]+)`/);
  if (tick) return tick[1].trim();
  const firstTok = String(val).trim().split(/\s+/)[0] || "";
  return firstTok.replace(/[`<>]/g, "");
}

/** Lower-case a field label and drop any "(...)" qualifier and bold markers. */
function normFieldKey(s) {
  return String(s)
    .replace(/[`*_]/g, "")
    .replace(/\([^)]*\)/g, " ") // strip parenthetical qualifiers
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Classify a normalized field label into a canonical item field, or "" if it is
 * not one of the recognized item fields. Prefix/keyword based so the tracker's
 * real label variants all map correctly while prose bullets are ignored.
 */
function classifyField(key) {
  if (/^(current |final )?state$/.test(key)) return "state";
  if (/^(percent completion|percent|completion)$/.test(key)) return "percent";
  if (
    /^(next required action|current next action|next action|next|proposed first action)$/.test(
      key
    )
  )
    return "nextAction";
  if (/^evidence(\s+of\s+\w+)?$/.test(key)) return "evidence"; // evidence / evidence of progress / evidence of completion
  if (/^parent epic$/.test(key)) return "parentEpic";
  if (/^link(\s+to\b.*)?$/.test(key) || /^tracker$/.test(key)) return "link"; // link / link to epic tracker
  return "";
}

/** "80%" / "80 %" / "80" → 80 ; non-numeric → null (never throws). */
function parsePercent(val) {
  const m = String(val).match(/(\d{1,3})\s*%?/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (Number.isNaN(n) || n < 0 || n > 100) return null;
  return n;
}

const isActive = (s) => /\bactive\b/i.test(s || "");
const isCompleted = (s) => /\b(completed|complete|done)\b/i.test(s || "");

// ── PURE CORE ─────────────────────────────────────────────────────────────────
/**
 * Evaluate the tracker system. All seams injected — NO fs, NO cwd.
 *
 * @param {object} input
 * @param {string} input.tracker        raw TRACKER.md contents ("" if missing).
 * @param {boolean} [input.trackerPresent]  whether TRACKER.md exists at all.
 *                                      (defaults to tracker.length > 0)
 * @param {Array}  [input.items]        pre-parsed items; if absent, parsed from tracker.
 * @param {object} [input.linkTargets]  map { "<repo-relative link>": boolean-exists }.
 *                                      A link present-as-key with false = broken.
 * @param {object} [input.pathExists]   map { "<§33 path>": boolean-exists }.
 * @returns {{ ok:boolean, checks:Array<{check,status,details}>, fatal:boolean }}
 *
 * NEVER throws on malformed tracker content — a parse failure becomes a FAIL.
 */
function evaluate(input) {
  const checks = [];
  const add = (check, details) =>
    checks.push({
      check,
      status: details.length === 0 ? "PASS" : "FAIL",
      details,
    });

  const trackerRaw = input && input.tracker != null ? String(input.tracker) : "";
  const trackerPresent =
    input && typeof input.trackerPresent === "boolean"
      ? input.trackerPresent
      : trackerRaw.length > 0;
  const linkTargets = (input && input.linkTargets) || {};
  const pathExists = (input && input.pathExists) || {};

  let sections;
  let items;
  try {
    sections = splitSections(trackerRaw);
    items =
      input && Array.isArray(input.items) ? input.items : parseItems(trackerRaw);
  } catch (e) {
    // Defensive: parsing is total, but if anything throws we FAIL closed.
    add("parse", [`tracker parse error (fail-closed): ${e.message}`]);
    return { ok: false, checks, fatal: false };
  }

  // (a) sections-present — all 34 §5 sections appear as headings.
  {
    const details = [];
    if (!trackerPresent) {
      details.push("TRACKER.md is missing — none of the 34 required sections present.");
    } else {
      for (const sec of REQUIRED_SECTIONS) {
        const found = !!findRequiredSection(sections, sec);
        if (!found) details.push(`required §5 section missing: "${sec}"`);
      }
    }
    add("sections-present", details);
  }

  // (b) no-blank-section — each present required section has content or sentinel.
  {
    const details = [];
    for (const sec of REQUIRED_SECTIONS) {
      const match = findRequiredSection(sections, sec);
      if (!match) continue; // absence is (a)'s job, not (b)'s — avoid double-report
      if (!sectionHasContent(match.body)) {
        details.push(
          `section "${sec}" is blank — add content or the explicit "None currently recorded." sentinel`
        );
      }
    }
    add("no-blank-section", details);
  }

  // (c) broken-links — every intra-repo TRACKER.md link target exists.
  {
    const details = [];
    const links = extractLinks(trackerRaw);
    for (const link of links) {
      // Only judge links we were given existence info for; an unknown link is
      // treated as broken (fail-closed) so a missing existence-probe can't pass.
      if (Object.prototype.hasOwnProperty.call(linkTargets, link)) {
        if (!linkTargets[link]) details.push(`broken intra-repo link: ${link} (target does not exist)`);
      } else {
        details.push(`unresolved intra-repo link: ${link} (existence not verified — fail-closed)`);
      }
    }
    add("broken-links", details);
  }

  // (d) active-tracker-files — active epics/sprints link to an existing /trackers/ file.
  {
    const details = [];
    for (const it of items) {
      if (!isActive(it.state)) continue;
      const link = it.trackerLink;
      if (!link) {
        details.push(`active ${it.kind} ${it.label} links to no tracker file`);
        continue;
      }
      const inTrackers = /(^|\/)trackers\//.test(link.replace(/\\/g, "/"));
      if (!inTrackers) {
        details.push(`active ${it.kind} ${it.label} tracker link "${link}" is not under /trackers/`);
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(linkTargets, link)) {
        if (!linkTargets[link])
          details.push(`active ${it.kind} ${it.label} tracker file missing: ${link}`);
      } else {
        details.push(`active ${it.kind} ${it.label} tracker file unverified: ${link} (fail-closed)`);
      }
    }
    add("active-tracker-files", details);
  }

  // (e) active-next-action — every active item names a next action.
  {
    const details = [];
    for (const it of items) {
      if (isActive(it.state) && !String(it.nextAction).trim()) {
        details.push(`active ${it.kind} ${it.label} has no next action`);
      }
    }
    add("active-next-action", details);
  }

  // (f) completed-evidence — every completed item records evidence.
  {
    const details = [];
    for (const it of items) {
      if (isCompleted(it.state) && !String(it.evidence).trim()) {
        details.push(`completed ${it.kind} ${it.label} has no evidence`);
      }
    }
    add("completed-evidence", details);
  }

  // (g) completed-100 — every completed item is 100%.
  {
    const details = [];
    for (const it of items) {
      if (isCompleted(it.state) && it.percent !== null && it.percent !== 100) {
        details.push(`completed ${it.kind} ${it.label} is ${it.percent}% (must be 100%)`);
      }
    }
    add("completed-100", details);
  }

  // (h) hundred-completed — every 100% item is marked completed.
  {
    const details = [];
    for (const it of items) {
      if (it.percent === 100 && !isCompleted(it.state)) {
        details.push(`${it.kind} ${it.label} is 100% but state is "${it.state || "(none)"}" (not completed)`);
      }
    }
    add("hundred-completed", details);
  }

  // (i) sprint-parent-epic — every sprint names a parent epic.
  {
    const details = [];
    for (const it of items) {
      if (it.kind === "sprint" && !String(it.parentEpic).trim()) {
        details.push(`sprint ${it.label} names no parent epic`);
      }
    }
    add("sprint-parent-epic", details);
  }

  // (j) ambiguous-language — no §21 prohibited ambiguous-state phrase appears,
  // EXCEPT inside the "Language Rules" section, which legitimately QUOTES the
  // prohibited phrases as the canonical examples of what not to write. Scanning
  // the whole doc there would flag the rule that forbids them (self-reference).
  {
    const details = [];
    const scanText = sections
      .filter((s) => !/language/i.test(s.headingText))
      .map((s) => s.body)
      .join("\n")
      .toLowerCase();
    for (const phrase of AMBIGUOUS_PHRASES) {
      if (scanText.includes(phrase)) {
        details.push(`ambiguous §21 phrase present: "${phrase}"`);
      }
    }
    add("ambiguous-language", details);
  }

  // (k) undefined-terms — core terms USED in the body but absent from the
  // Definitions. Per spec §8.1 each term gets a "## Definition: <Term>" block,
  // which the section parser splits into its OWN section — so the definitions
  // corpus is: every "Definition: *" section + the "Definitions" intro section
  // + the "State Model" section (where the state terms are formally defined).
  {
    const details = [];
    const isDefSection = (s) =>
      headingMatchesSection(s.headingText, "Definitions") ||
      /^definition:\s*/i.test(s.headingText.trim()) ||
      headingMatchesSection(s.headingText, "State Model");
    const defsBody = sections
      .filter(isDefSection)
      .map((s) => `${s.headingText}\n${s.body}`)
      .join("\n")
      .toLowerCase();
    const bodyOutsideDefs = sections
      .filter((s) => !isDefSection(s))
      .map((s) => s.body)
      .join("\n")
      .toLowerCase();
    for (const term of CORE_TERMS) {
      const t = term.toLowerCase();
      if (!new RegExp(`\\b${escapeRe(t)}\\b`).test(bodyOutsideDefs)) continue; // unused → exempt
      if (!new RegExp(`\\b${escapeRe(t)}\\b`).test(defsBody)) {
        details.push(`operational term "${term}" is used but not defined in §8 Definitions`);
      }
    }
    add("undefined-terms", details);
  }

  // (l) required-paths — the §33 required files/dirs/templates exist.
  {
    const details = [];
    for (const p of REQUIRED_PATHS) {
      if (Object.prototype.hasOwnProperty.call(pathExists, p)) {
        if (!pathExists[p]) details.push(`required §33 path missing: ${p}`);
      } else {
        details.push(`required §33 path unverified: ${p} (existence not probed — fail-closed)`);
      }
    }
    add("required-paths", details);
  }

  const ok = checks.every((c) => c.status === "PASS");
  return { ok, checks, fatal: false };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── FS layer (thin) ───────────────────────────────────────────────────────────
const abs = (rel) => path.join(ROOT, rel.replace(/\/+$/g, "").split("/").join(path.sep) + (rel.endsWith("/") ? path.sep : ""));

function existsRepo(rel) {
  const clean = rel.replace(/\\/g, "/");
  const wantDir = clean.endsWith("/");
  const full = path.join(ROOT, clean);
  try {
    const st = fs.statSync(full);
    return wantDir ? st.isDirectory() : st.isFile();
  } catch {
    return false;
  }
}

/** Resolve a TRACKER.md-relative link to a repo-relative path and test existence. */
function resolveLinkExists(link) {
  // Links in TRACKER.md are relative to repo root (TRACKER.md lives at root).
  const clean = link.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, "");
  const full = path.join(ROOT, clean);
  try {
    fs.statSync(full);
    return true;
  } catch {
    return false;
  }
}

function run() {
  const trackerPath = path.join(ROOT, "TRACKER.md");
  let tracker = "";
  let trackerPresent = false;
  try {
    tracker = fs.readFileSync(trackerPath, "utf8");
    trackerPresent = true;
  } catch (e) {
    if (e.code !== "ENOENT") {
      // Unreadable for a reason OTHER than absence → runner error, fail-closed.
      return { ok: false, checks: [], fatal: true, error: `TRACKER.md unreadable: ${e.message}` };
    }
    tracker = "";
    trackerPresent = false;
  }

  // Build the link-existence map from the real markdown links in TRACKER.md...
  const links = extractLinks(tracker);
  const linkTargets = {};
  for (const l of links) linkTargets[l] = resolveLinkExists(l);

  // ...plus each item's parsed tracker-file link (often a backtick-quoted path,
  // not a markdown link), so check (d) can report a missing tracker file
  // honestly ("missing") rather than as an unverified/fail-closed link.
  const items = parseItems(tracker);
  for (const it of items) {
    const l = it.trackerLink;
    if (l && !Object.prototype.hasOwnProperty.call(linkTargets, l)) {
      linkTargets[l] = resolveLinkExists(l);
    }
  }

  // Build the §33 path-existence map.
  const pathExists = {};
  for (const p of REQUIRED_PATHS) pathExists[p] = existsRepo(p);

  const res = evaluate({ tracker, trackerPresent, items, linkTargets, pathExists });
  res.fatal = false;
  res.summary = {
    sections: REQUIRED_SECTIONS.length,
    links: links.length,
    requiredPaths: REQUIRED_PATHS.length,
    root: ROOT,
  };
  return res;
}

// ── Reporting ─────────────────────────────────────────────────────────────────
function report(res) {
  const lines = [];
  if (res.fatal) {
    lines.push(`FATAL [${NAME}] runner error (fail-closed): ${res.error || "unknown"}`);
    return lines.join("\n");
  }
  const failed = res.checks.filter((c) => c.status === "FAIL");
  if (res.ok) {
    lines.push(`PASS [${NAME}] all ${res.checks.length} checks pass`);
  } else {
    lines.push(`FAIL [${NAME}] ${failed.length}/${res.checks.length} check(s) failed`);
  }
  for (const c of res.checks) {
    lines.push(`  ${c.status === "PASS" ? "·" : "✗"} ${c.check}: ${c.status}`);
    for (const d of c.details) lines.push(`      - ${d}`);
  }
  if (res.summary) {
    lines.push(
      `  (${res.summary.links} link(s) · ${res.summary.requiredPaths} §33 path(s) · root ${res.summary.root})`
    );
  }
  return lines.join("\n");
}

// ── In-file bite-test ─────────────────────────────────────────────────────────
/**
 * Proves each named check FIRES on a failing synthetic input AND stays clean on
 * a passing one. A validator with no negative test is a false-green waiting to
 * happen. Runs with: node scripts/trackers/validate.js --selftest
 */
function selftest() {
  const results = [];
  const t = (name, fn) => {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (e) {
      results.push({ name, ok: false, err: e.message });
    }
  };
  const assert = (cond, msg) => {
    if (!cond) throw new Error(msg || "assertion failed");
  };
  const checkOf = (res, name) => res.checks.find((c) => c.check === name);
  const passes = (res, name) => checkOf(res, name).status === "PASS";
  const fails = (res, name) => checkOf(res, name).status === "FAIL";

  // ── Representative fixtures ──────────────────────────────────────────────
  // The synthetic tracker mirrors the REAL TRACKER.md structure so the parser
  // itself is bite-tested: the 34 §5 sections are H1 headings; "Header" is the
  // `# TRACKER.md` title block (Version/Owner/Authority), NOT a literal
  // `# Header`; definitions are `## Definition: <Term>` H2 subsections under
  // `# Definitions`; epic/sprint items are `### <LABEL>` H3 subsections under
  // the Active/Planned/Completed Epics/Sprints H1 sections, with bulleted
  // fields. Items are parsed from this markdown (NOT injected), so a–i exercise
  // the H1-section / H3-item / H2-definition parsing both ways.

  // The Header (spec §6) is the document-title H1 + version/owner/authority.
  const HEADER_BLOCK = [
    "# TRACKER.md",
    "",
    "Version: 1.0.0",
    "Owner: President Agent",
    "Authority: highest written source of truth for tracked work.",
    "",
  ].join("\n");

  // Default coherent items, by section. Each renders to a `### <LABEL>` H3 with
  // the real field labels. kind/state derive from the containing section.
  const defaultItems = () => ({
    "Active Epics": [
      {
        label: "E-DEMO-001 — demo epic",
        fields: {
          "Current state": "Active.",
          "Percent completion": "40%",
          "Next required action": "Build the engine.",
          "Evidence of progress": "scaffolding committed.",
          "Link to epic tracker": "`trackers/epics/E-DEMO-001-x.md`",
        },
      },
    ],
    "Active Sprints": [
      {
        label: "T1 — demo sprint",
        fields: {
          "Current state": "Active.",
          "Percent completion": "50%",
          "Next required action": "Write the validator.",
          "Evidence of progress": "draft authored.",
          "Parent epic": "E-DEMO-001.",
          "Link to sprint tracker": "`trackers/sprints/T1-y.md`",
        },
      },
    ],
    "Completed Epics": [
      {
        label: "E-DONE-000 — finished epic",
        fields: {
          "Final state": "Completed.",
          "Percent completion": "100%",
          "Evidence of completion (verified against disk + git)": "commit abc123; scan green.",
          "Link to epic tracker": "`trackers/epics/E-DONE-000-z.md`",
        },
      },
    ],
  });

  // The tracker links each item declares (so (c)/(d) can resolve them).
  const itemLinkTargets = {
    "trackers/epics/E-DEMO-001-x.md": true,
    "trackers/sprints/T1-y.md": true,
    "trackers/epics/E-DONE-000-z.md": true,
  };

  // Render an item map back into a faithful markdown tracker.
  const renderTracker = (itemsBySection) =>
    REQUIRED_SECTIONS.map((s) => {
      if (s === "Header") return HEADER_BLOCK;
      if (s === "Definitions") {
        // Define every core term as a `## Definition: <Term>` H2 so (k) is clean.
        const defs = CORE_TERMS.map(
          (term) =>
            `## Definition: ${term}\nDefinition: operational definition of ${term}.\nWhy it matters: it matters.\nWhere it applies: everywhere.`
        ).join("\n\n");
        return `# ${s}\n\n${defs}\n`;
      }
      const its = itemsBySection[s];
      if (its && its.length) {
        const body = its
          .map(
            (it) =>
              `### ${it.label}\n` +
              Object.entries(it.fields)
                .map(([k, v]) => `- ${k}: ${v}`)
                .join("\n")
          )
          .join("\n\n");
        return `# ${s}\n\n${body}\n`;
      }
      return `# ${s}\n\nNone currently recorded.\n`;
    }).join("\n");

  const coherentSections = renderTracker(defaultItems());
  const coherentPaths = {};
  for (const p of REQUIRED_PATHS) coherentPaths[p] = true;

  // A coherent input — items are PARSED from the markdown (not injected), so the
  // parser is exercised. linkTargets cover the item links + are fail-closed safe.
  const coherent = () => ({
    tracker: coherentSections,
    trackerPresent: true,
    linkTargets: { ...itemLinkTargets },
    pathExists: { ...coherentPaths },
  });

  // Build an input from a mutated item map (re-rendered, re-parsed).
  const withItems = (mutate) => {
    const map = defaultItems();
    mutate(map);
    return {
      tracker: renderTracker(map),
      trackerPresent: true,
      linkTargets: { ...itemLinkTargets },
      pathExists: { ...coherentPaths },
    };
  };

  // 0. POSITIVE — coherent input → ok:true, every check PASS.
  t("coherent → all checks PASS", () => {
    const res = evaluate(coherent());
    assert(res.ok, "expected ok:true, failures: " +
      res.checks.filter((c) => c.status === "FAIL").map((c) => c.check + " " + c.details.join("; ")).join(" | "));
    assert(!res.fatal, "must not be fatal");
  });

  // (a) sections-present — drop a section → fires.
  t("(a) missing section → sections-present FAIL", () => {
    const s = coherent();
    s.tracker = s.tracker.replace("# Known Gaps and Open Flaws", "# Bogus Heading");
    const res = evaluate(s);
    assert(fails(res, "sections-present"), "expected sections-present FAIL");
    assert(checkOf(res, "sections-present").details.some((d) => d.includes("Known Gaps")), "should name the missing section");
  });

  // (a) PASS — coherent keeps it green (incl. the `# TRACKER.md` Header block).
  t("(a) coherent → sections-present PASS", () => assert(passes(evaluate(coherent()), "sections-present")));

  // (a) Header — a title block missing version/owner/authority FAILs "Header".
  t("(a) header w/o version/owner block → sections-present FAIL", () => {
    const s = coherent();
    s.tracker = s.tracker.replace(HEADER_BLOCK, "# TRACKER.md\n\nA title with no version/owner/authority block.\n");
    const res = evaluate(s);
    assert(fails(res, "sections-present"), "expected sections-present FAIL");
    assert(checkOf(res, "sections-present").details.some((d) => d.includes("Header")), "should name Header");
  });

  // (b) no-blank-section — blank a section (no content, no sentinel) → fires.
  t("(b) blank section → no-blank-section FAIL", () => {
    const s = coherent();
    s.tracker = s.tracker.replace("# Untracked Work\n\nNone currently recorded.\n", "# Untracked Work\n\n");
    const res = evaluate(s);
    assert(fails(res, "no-blank-section"), "expected no-blank-section FAIL");
  });
  t("(b) sentinel section → no-blank-section PASS", () => assert(passes(evaluate(coherent()), "no-blank-section")));

  // (c) broken-links — a link target that does not exist → fires.
  t("(c) broken link → broken-links FAIL", () => {
    const s = coherent();
    s.tracker = coherentSections + "\n\nSee [the sprint](trackers/sprints/MISSING.md).\n";
    s.linkTargets = { ...itemLinkTargets, "trackers/sprints/MISSING.md": false };
    const res = evaluate(s);
    assert(fails(res, "broken-links"), "expected broken-links FAIL");
  });
  t("(c) clean links → broken-links PASS", () => {
    const s = coherent();
    s.tracker = coherentSections + "\n\nSee [the sprint](trackers/sprints/T1-y.md).\n";
    assert(passes(evaluate(s), "broken-links"));
  });
  // (c) fail-closed — an UNVERIFIED link (no existence info) is treated as broken.
  t("(c) unverified link → broken-links FAIL (fail-closed)", () => {
    const s = coherent();
    s.tracker = coherentSections + "\n\nSee [x](trackers/epics/UNKNOWN.md).\n";
    // deliberately do NOT add UNKNOWN.md to linkTargets
    const res = evaluate(s);
    assert(fails(res, "broken-links"), "unverified link must fail closed");
  });

  // (d) active-tracker-files — active item with no tracker link → fires.
  t("(d) active w/o tracker file → active-tracker-files FAIL", () => {
    const s = withItems((m) => {
      delete m["Active Epics"][0].fields["Link to epic tracker"];
    });
    const res = evaluate(s);
    assert(fails(res, "active-tracker-files"), "expected active-tracker-files FAIL");
  });
  // (d) active item whose tracker file is MISSING (link present but unresolvable) → fires.
  t("(d) active tracker file missing → active-tracker-files FAIL", () => {
    const s = withItems((m) => {
      m["Active Sprints"][0].fields["Link to sprint tracker"] = "`trackers/sprints/GONE.md`";
    });
    s.linkTargets = { ...itemLinkTargets, "trackers/sprints/GONE.md": false };
    const res = evaluate(s);
    assert(fails(res, "active-tracker-files"), "expected active-tracker-files FAIL");
    assert(checkOf(res, "active-tracker-files").details.some((d) => /GONE\.md/.test(d)), "names the missing file");
  });
  t("(d) active w/ tracker file → active-tracker-files PASS", () => assert(passes(evaluate(coherent()), "active-tracker-files")));

  // (e) active-next-action — active item with no next action → fires.
  t("(e) active w/o next action → active-next-action FAIL", () => {
    const s = withItems((m) => {
      delete m["Active Epics"][0].fields["Next required action"];
    });
    const res = evaluate(s);
    assert(fails(res, "active-next-action"), "expected active-next-action FAIL");
  });
  t("(e) active w/ next action → active-next-action PASS", () => assert(passes(evaluate(coherent()), "active-next-action")));

  // (f) completed-evidence — completed item with no evidence → fires.
  t("(f) completed w/o evidence → completed-evidence FAIL", () => {
    const s = withItems((m) => {
      delete m["Completed Epics"][0].fields["Evidence of completion (verified against disk + git)"];
    });
    const res = evaluate(s);
    assert(fails(res, "completed-evidence"), "expected completed-evidence FAIL");
  });
  // (f) PASS — the parenthetical-qualified evidence label is parsed as evidence.
  t("(f) completed w/ qualified evidence → completed-evidence PASS", () => assert(passes(evaluate(coherent()), "completed-evidence")));

  // (g) completed-100 — completed item below 100% → fires.
  t("(g) completed <100% → completed-100 FAIL", () => {
    const s = withItems((m) => {
      m["Completed Epics"][0].fields["Percent completion"] = "80%";
    });
    const res = evaluate(s);
    assert(fails(res, "completed-100"), "expected completed-100 FAIL");
  });
  t("(g) completed at 100% → completed-100 PASS", () => assert(passes(evaluate(coherent()), "completed-100")));

  // (h) hundred-completed — 100% item not marked completed → fires.
  t("(h) 100% not completed → hundred-completed FAIL", () => {
    const s = withItems((m) => {
      m["Active Epics"][0].fields["Percent completion"] = "100%"; // active+100% → contradiction
    });
    const res = evaluate(s);
    assert(fails(res, "hundred-completed"), "expected hundred-completed FAIL");
  });
  t("(h) 100%↔completed consistent → hundred-completed PASS", () => assert(passes(evaluate(coherent()), "hundred-completed")));

  // (i) sprint-parent-epic — sprint with no parent epic → fires.
  t("(i) sprint w/o parent epic → sprint-parent-epic FAIL", () => {
    const s = withItems((m) => {
      delete m["Active Sprints"][0].fields["Parent epic"];
    });
    const res = evaluate(s);
    assert(fails(res, "sprint-parent-epic"), "expected sprint-parent-epic FAIL");
  });
  t("(i) sprint w/ parent epic → sprint-parent-epic PASS", () => assert(passes(evaluate(coherent()), "sprint-parent-epic")));

  // (j) ambiguous-language — a §21 prohibited phrase → fires.
  t("(j) ambiguous phrase → ambiguous-language FAIL", () => {
    const s = coherent();
    s.tracker = coherentSections + "\n\nThis epic is probably complete and should be fine.\n";
    const res = evaluate(s);
    assert(fails(res, "ambiguous-language"), "expected ambiguous-language FAIL");
    assert(checkOf(res, "ambiguous-language").details.length >= 2, "should catch both phrases");
  });
  t("(j) clean language → ambiguous-language PASS", () => assert(passes(evaluate(coherent()), "ambiguous-language")));

  // (k) undefined-terms — a used core term missing from Definitions → fires.
  t("(k) undefined term → undefined-terms FAIL", () => {
    const s = coherent();
    // Remove the Reconciliation `## Definition:` block but keep using the term.
    s.tracker = s.tracker.replace(
      "## Definition: Reconciliation\nDefinition: operational definition of Reconciliation.\nWhy it matters: it matters.\nWhere it applies: everywhere.",
      ""
    ) + "\n\nThe Reconciliation step resolves conflicts.\n";
    const res = evaluate(s);
    assert(fails(res, "undefined-terms"), "expected undefined-terms FAIL");
    assert(checkOf(res, "undefined-terms").details.some((d) => /Reconciliation/.test(d)), "should name Reconciliation");
  });
  t("(k) all used terms defined → undefined-terms PASS", () => assert(passes(evaluate(coherent()), "undefined-terms")));

  // (l) required-paths — a missing §33 path → fires.
  t("(l) missing §33 path → required-paths FAIL", () => {
    const s = coherent();
    s.pathExists = { ...coherentPaths, "UNTRACKED_WORK.md": false };
    const res = evaluate(s);
    assert(fails(res, "required-paths"), "expected required-paths FAIL");
  });
  t("(l) all §33 paths present → required-paths PASS", () => assert(passes(evaluate(coherent()), "required-paths")));
  // (l) fail-closed — an unprobed path is treated as missing.
  t("(l) unprobed §33 path → required-paths FAIL (fail-closed)", () => {
    const s = coherent();
    s.pathExists = { ...coherentPaths };
    delete s.pathExists["ROADMAP.md"];
    const res = evaluate(s);
    assert(fails(res, "required-paths"), "unprobed path must fail closed");
  });

  // FAIL-CLOSED — missing tracker → not a pass, sections-present FAILs, never throws.
  t("missing tracker → not-ok, fail-closed (no throw)", () => {
    const res = evaluate({ tracker: "", trackerPresent: false, items: [], linkTargets: {}, pathExists: coherentPaths });
    assert(!res.ok, "missing tracker must not be ok");
    assert(fails(res, "sections-present"), "missing tracker → sections-present FAIL");
    assert(!res.fatal, "evaluate must not mark fatal for missing content");
  });

  // FAIL-CLOSED — malformed/garbage input does not throw and is not ok.
  t("garbage input → handled, not-ok, no throw", () => {
    const res = evaluate({ tracker: " ￿###no headings here\n[bad](", trackerPresent: true, linkTargets: {}, pathExists: {} });
    assert(res && Array.isArray(res.checks), "must return a structured result");
    assert(!res.ok, "garbage must not pass");
  });

  // parseItems extracts items ONLY from the H1 state sections, one per `### <LABEL>`
  // H3, reading the real field-label variants — and NEVER scrapes prose/defs.
  t("parseItems extracts items from H1 sections + H3 labels (real structure)", () => {
    const md = [
      "# Definitions",
      "## Definition: Sprint",
      "Definition: prose mentioning a sprint-conductor and epic-based roadmap (must NOT become items).",
      "",
      "# Active Sprints",
      "### T7 — ε runtime",
      "- Link to sprint tracker: `trackers/sprints/T7-eps.md`",
      "- Current state: Active.",
      "- Percent completion: 50%",
      "- Next required action: spawn agents.",
      "- Parent epic: E-DEMO-007.",
      "",
      "# Completed Epics",
      "### E-DONE-000 — foundation",
      "- Final state: Completed.",
      "- Percent completion: 100%",
      "- Evidence of completion (verified vs git): commit db0a778. Parent epic: none.",
    ].join("\n");
    const items = parseItems(md);
    // Prose/definitions must NOT be scraped as items.
    assert(items.length === 2, "exactly 2 items (no prose/def scraping), got " + items.length + ": " + items.map((i) => i.label).join(","));
    const sp = items.find((i) => i.label === "T7");
    const ep = items.find((i) => i.label === "E-DONE-000");
    assert(sp && sp.kind === "sprint" && sp.percent === 50 && sp.parentEpic === "E-DEMO-007.", "sprint parse");
    assert(sp.state === "Active." && sp.nextAction === "spawn agents." && sp.trackerLink === "trackers/sprints/T7-eps.md", "sprint fields");
    assert(ep && ep.kind === "epic" && ep.percent === 100 && /db0a778/.test(ep.evidence), "epic parse (qualified evidence label)");
  });

  // parseItems must NOT treat prose like "epic-based" / "sprint-conductor" as items.
  t("parseItems ignores prose EPIC-/SPRINT-like tokens outside item sections", () => {
    const md = [
      HEADER_BLOCK,
      "# Definitions",
      "## Definition: Epic",
      "Definition: the ROADMAP is not yet epic-based; the ε sprint-conductor runtime shipped.",
      "# System Inventory",
      "| ROADMAP.md | File | not yet epic-based | Yes |",
    ].join("\n");
    const items = parseItems(md);
    assert(items.length === 0, "prose must yield zero items, got: " + items.map((i) => i.label).join(","));
  });

  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    process.stdout.write(`  ${r.ok ? "ok" : "FAIL"}  ${r.name}${r.ok ? "" : " — " + r.err}\n`);
  }
  if (failed.length) {
    process.stderr.write(`\n${NAME} selftest: ${results.length - failed.length}/${results.length} passed, ${failed.length} FAILED\n`);
    process.exit(1);
  }
  process.stdout.write(`\n${NAME} selftest: ${results.length}/${results.length} bite cases passed (positive + a–l fire both ways + fail-closed)\n`);
  process.exit(0);
}

// ── main ──────────────────────────────────────────────────────────────────────
function main() {
  const argv = process.argv.slice(2);
  const unknown = argv.filter((a) => !["--json", "--selftest", "--help", "-h"].includes(a));
  if (argv.includes("-h") || argv.includes("--help")) {
    process.stdout.write(
      `Usage: node scripts/trackers/validate.js [--json] [--selftest]\n` +
        `  (default) validate the live tracker system, print a text report\n` +
        `  --json      machine-readable result\n` +
        `  --selftest  run the in-file bite-test\n` +
        `Exit: 0 all-pass · 1 failures found · 2 usage/runner error (fail-closed)\n`
    );
    process.exit(0);
  }
  if (unknown.length) {
    process.stderr.write(`${NAME}: unknown argument(s): ${unknown.join(", ")}\n`);
    process.exit(2);
  }
  if (argv.includes("--selftest")) {
    selftest();
    return;
  }

  let res;
  try {
    res = run();
  } catch (e) {
    // Any uncaught runner error → exit 2, fail-closed. NEVER false-green.
    process.stderr.write(`${NAME}: runner error (fail-closed): ${e.message}\n`);
    process.exit(2);
  }

  if (argv.includes("--json")) {
    process.stdout.write(JSON.stringify(res, null, 2) + "\n");
  } else {
    process.stdout.write(report(res) + "\n");
  }
  if (res.fatal) process.exit(2);
  process.exit(res.ok ? 0 : 1);
}

if (require.main === module) main();

module.exports = {
  evaluate,
  splitSections,
  parseItems,
  extractLinks,
  parsePercent,
  sectionHasContent,
  REQUIRED_SECTIONS,
  REQUIRED_PATHS,
  AMBIGUOUS_PHRASES,
  CORE_TERMS,
  run,
};
