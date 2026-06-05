#!/usr/bin/env node
"use strict";

// scan:skill-hook-coverage — BIDIRECTIONAL coverage of the skill hook-point registry
// (.claude/agents/_org/skill-hook-points.json). M1 §8. The SKILLS sibling of
// scan:sprint-hook-coverage — a STATIC (no events) enforcer made self-detecting on the
// skill<->agent dispatch surface.
//
// REVERSE (registry coherence): the registry is structurally coherent — every row's role
//   exists in role-registry, every multi-row hook_point has exactly one default. Delegates
//   to skillHookPoints.validate() (the same tripwire its own test asserts). Fail-CLOSED:
//   an incoherent registry -> exit 2 (a coverage check that errors must never read green).
//
// FORWARD (coverage): every skill REGISTERED in the registry resolves to a real skill file
//   at .claude/commands/<ns>/<name>.md — a registered-but-phantom entry is `phantom_skill_entry`.
//
// HARDCODE / STALE — TWO ASYMMETRIC checks on every .claude/commands/**/*.md body:
//
//   (1) STALE (persona-rename), scanned ANYWHERE in a command body, NARROWED to PERSONA
//       renames only. personaStaleNames = the `was` values of roles whose id matches
//       /^director-/ OR /-lead$/ (the management personas). This EXCLUDES worker scraps
//       (redteam/qa/reviewer/compliance/builder/fixer/req-reviewer): their `was` values
//       appear legitimately all over .claude/commands (skill names like /redteam:full,
//       /qa:audit; dispatch docs), so flagging them would flood false positives. Any LINE
//       containing a personaStaleName (word-boundary) -> `hardcoded_stale_role` (HIGH —
//       a renamed-away persona name is always wrong, descriptive OR dispatch), UNLESS the
//       line carries the suppress marker `stale-ok`.
//
//   (2) CURRENT-persona DISPATCH, kept NARROW to a dispatch context. personaRoles = the
//       skill-hook-points key-roles that are real registry ids. A current persona counts
//       as a "dispatch" when EITHER (a) it follows `subagent_type` (SUBAGENT_TYPE_RE), OR
//       (b) it appears bold-backtick **`<role>`** on a LINE that ALSO carries a dispatch
//       keyword (subagent|dispatch|resolve|consult). Registered skill -> `hardcoded_role`;
//       unregistered skill -> `unregistered_persona_skill`. GENERIC_ROLES are never flagged.
//
//   allowlist = skills migration-pending (M1-c); their (1)/(2) hits -> info (tracked). An
//   allowlisted skill with NO hardcode -> `stale_allowlist_entry` (the allowlist must not
//   rot — mirrors scan-coverage's reasonless/stale self-flagging).
//
// See .claude/commands/scan/skill-hook-coverage.md for the full spec.

const fs = require("fs");
const path = require("path");
const { PATHS } = require("../hooks/lib/paths");
const skillHookPoints = require("../skills/skill-hook-points");

// ── Constants ─────────────────────────────────────────────────────────────────

// Stable faces + generics — legit literal dispatches (mode:adhoc spawns beta/gamma;
// models/karpathy use general-purpose), NOT renameable personas. Excluded from the
// `hardcoded_role` branch only — a renamed-AWAY name still trips `hardcoded_stale_role`.
const GENERIC_ROLES = new Set([
  "alpha", "beta", "gamma", "delta", "epsilon",
  "general-purpose", "builder", "fixer", "stub-scaffold",
]);

// M1-c COMPLETE for the registered agent-calling skills — all should resolve their persona
// from the skill-hook registry at call time, no hardcoded names (neither subagent_type
// literals nor bold-backtick prose dispatch). The allowlist is EMPTY: any skill that
// hardcodes a persona now FAILS the gate (no migration-pending escape hatch left).
const MIGRATION_PENDING = [];
const ALLOWLIST_REASON = "M1-c prose migration pending";

// A dispatch that hardcodes a persona role: `subagent_type` followed by a role name.
const SUBAGENT_TYPE_RE = /subagent_type["'\s:=]+([a-z][a-z0-9-]+)/g;

// A persona named in bold-backtick prose: **`<role>`** (the prose-dispatch idiom).
const BOLD_BACKTICK_ROLE_RE = /\*\*`([a-z][a-z0-9-]+)`\*\*/g;

// On a bold-backtick line, ONE of these words turns "named" into "dispatched".
const DISPATCH_KEYWORD_RE = /\b(subagent|dispatch|resolve|consult)/i;

// The suppress marker for the STALE line-scan (e.g. a legit counter-example in docs).
const STALE_OK_MARKER = "stale-ok";

// ── CLI flags ─────────────────────────────────────────────────────────────────

const JSON_OUT = process.argv.includes("--json");

// ── Stale-name derivation (renamed-away PERSONA names only) ─────────────────────

/**
 * The renamed-away names of the MANAGEMENT PERSONAS only — the `was` values of roles whose
 * id matches /^director-/ OR /-lead$/. Deliberately EXCLUDES worker scraps (redteam, qa,
 * reviewer, compliance, fixer, req-reviewer, …): their `was` values appear legitimately all
 * over .claude/commands (skill names, dispatch docs) and flagging them floods false positives.
 * `was` may be a string OR an array.
 * @param {object} roleRegistryRoles  the roles{} map from role-registry.json
 * @returns {Set<string>}
 */
function derivePersonaStaleNames(roleRegistryRoles = {}) {
  const out = new Set();
  for (const [key, role] of Object.entries(roleRegistryRoles)) {
    if (!role || typeof role !== "object" || role.was == null) continue;
    const id = typeof role.id === "string" && role.id ? role.id : key;
    if (!/^director-/.test(id) && !/-lead$/.test(id)) continue; // management personas only
    const vals = Array.isArray(role.was) ? role.was : [role.was];
    for (const v of vals) if (typeof v === "string" && v.trim()) out.add(v.trim());
  }
  return out;
}

// ── Filesystem helpers (command-file glob; no external dep) ────────────────────

/** Recurse paths.commands and return [{ skill, path, body }] — skill id = "<ns>:<name>". */
function loadCommandFiles(commandsDir = PATHS.commands) {
  const out = [];
  if (!commandsDir || !fs.existsSync(commandsDir)) return out;
  const walk = (dir, ns) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full, ns ? `${ns}/${ent.name}` : ent.name);
      } else if (ent.isFile() && ent.name.endsWith(".md")) {
        const name = ent.name.slice(0, -3);
        const skill = ns ? `${ns}:${name}` : name;
        let body = "";
        try { body = fs.readFileSync(full, "utf8"); } catch { /* skip unreadable */ }
        out.push({ skill, path: full, body });
      }
    }
  };
  walk(commandsDir, "");
  return out;
}

/** A skill id ("growth:message-brief") -> its expected command file path. */
function skillToCommandPath(skillId, commandsDir = PATHS.commands) {
  const rel = String(skillId).replace(/:/g, path.sep) + ".md";
  return path.join(commandsDir, rel);
}

// ── Core compute (exported, PURE given its inputs — no disk) ───────────────────

/**
 * @param {object}        registry           the skill hook-point registry
 * @param {string[]}      roleIds            real role ids from role-registry
 * @param {object[]}      commandFiles       [{ skill, path, body }]
 * @param {Set<string>}   personaStaleNames  renamed-away MANAGEMENT-persona names
 * @param {Set<string>}   personaRoles       optional override of the renameable persona roles
 * @param {Set<string>}   allowlist          migration-pending skill ids
 * @returns {{ findings, info }}
 */
function evaluate({
  registry,
  roleIds,
  commandFiles = [],
  personaStaleNames = new Set(),
  personaRoles: personaRolesArg,
  allowlist = new Set(),
}) {
  const findings = [];
  const info = [];

  // 1. REVERSE — registry coherence. Surface every error as a finding; main() maps to exit 2.
  const rev = skillHookPoints.validate(registry, roleIds);
  if (!rev.ok) {
    for (const e of rev.errors) findings.push({ finding_type: "registry_incoherent", evidence: e });
  }

  const roleIdSet = new Set(roleIds);
  // The renameable PERSONAS: registry roles that are ALSO key-roles in skill-hook-points.
  const personaRoles =
    personaRolesArg ||
    new Set(skillHookPoints.hookRows(registry).map((r) => r.role).filter((r) => roleIdSet.has(r)));

  // 2. FORWARD — every REGISTERED skill resolves to a real command file.
  const filePaths = new Set(commandFiles.map((c) => c.path));
  for (const skill of skillHookPoints.skillIds(registry)) {
    const expected = skillToCommandPath(skill);
    if (!fs.existsSync(expected) && !filePaths.has(expected)) {
      findings.push({
        finding_type: "phantom_skill_entry",
        skill,
        evidence: `registered skill '${skill}' has no command file at ${expected}`,
      });
    }
  }

  const registeredSkills = new Set(skillHookPoints.skillIds(registry));

  // 3. HARDCODE / STALE — scan every command body line-by-line.
  //    Track which allowlisted skills actually carry a hardcode (to detect rot).
  const allowlistHit = new Set();
  const push = (skillAllowed, finding) => {
    if (skillAllowed) { allowlistHit.add(finding.skill); info.push(finding); }
    else findings.push(finding);
  };

  for (const cf of commandFiles) {
    const allowed = allowlist.has(cf.skill);
    const lines = String(cf.body).split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // (1) STALE — a renamed-away MANAGEMENT-persona name ANYWHERE on the line, unless
      //     suppressed. Descriptive OR dispatch: a renamed-away persona name is always wrong.
      const suppressed = line.includes(STALE_OK_MARKER);
      if (!suppressed) {
        for (const stale of personaStaleNames) {
          const re = new RegExp(`(?<![A-Za-z0-9-])${escapeRe(stale)}(?![A-Za-z0-9-])`);
          if (re.test(line)) {
            push(allowed, {
              finding_type: "hardcoded_stale_role",
              skill: cf.skill,
              role: stale,
              severity: "high",
              path: cf.path,
              line: i + 1,
              evidence: `${cf.skill} names persona '${stale}' (line ${i + 1}) — a role the registry renamed away (stale; would fail to dispatch)`,
            });
          }
        }
      }

      // (2) CURRENT-persona DISPATCH — narrow to a dispatch context.
      //     (a) subagent_type: <persona>
      SUBAGENT_TYPE_RE.lastIndex = 0;
      let m;
      while ((m = SUBAGENT_TYPE_RE.exec(line)) !== null) {
        flagCurrentPersona(m[1]);
      }
      //     (b) **`<persona>`** on a line that ALSO carries a dispatch keyword.
      if (DISPATCH_KEYWORD_RE.test(line)) {
        BOLD_BACKTICK_ROLE_RE.lastIndex = 0;
        let b;
        while ((b = BOLD_BACKTICK_ROLE_RE.exec(line)) !== null) {
          flagCurrentPersona(b[1]);
        }
      }

      // eslint-disable-next-line no-inner-declarations
      function flagCurrentPersona(name) {
        if (personaStaleNames.has(name)) return; // already covered by (1) STALE
        if (GENERIC_ROLES.has(name)) return; // stable face / generic — legit literal dispatch
        if (!personaRoles.has(name)) return; // not a renameable persona — out of scope
        const type = registeredSkills.has(cf.skill) ? "hardcoded_role" : "unregistered_persona_skill";
        const why =
          type === "hardcoded_role"
            ? `should resolve via skill-hook-points at call time`
            : `dispatches a persona but is not registered in skill-hook-points`;
        push(allowed, {
          finding_type: type,
          skill: cf.skill,
          role: name,
          path: cf.path,
          line: i + 1,
          evidence: `${cf.skill} dispatches persona '${name}' (line ${i + 1}) — ${why}`,
        });
      }
    }
  }

  // 3b. The allowlist must not rot — an allowlisted skill with NO hardcode is already
  //     migrated and should be removed from the allowlist (mirror scan-coverage self-flagging).
  for (const skill of allowlist) {
    if (!allowlistHit.has(skill)) {
      findings.push({
        finding_type: "stale_allowlist_entry",
        skill,
        evidence: `allowlisted skill '${skill}' (${ALLOWLIST_REASON}) no longer hardcodes a persona role — remove it from the allowlist`,
      });
    }
  }

  return { findings, info };
}

/** Escape a literal for use inside a RegExp. */
function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function main() {
  // Load the registry + roster (fail-closed on unreadable/broken).
  let registry, roleIds, roles;
  try {
    registry = skillHookPoints.load();
    roleIds = skillHookPoints.loadRoleIds();
    roles = skillHookPoints.loadRoles();
  } catch (e) {
    process.stderr.write(`ERROR [skill-hook-coverage] cannot read registry/roster: ${e.message}\n`);
    return 2;
  }

  // REVERSE first — a structurally incoherent registry is fail-closed (exit 2) regardless.
  const rev = skillHookPoints.validate(registry, roleIds);
  if (!rev.ok) {
    process.stderr.write(
      `FAIL [skill-hook-coverage] registry incoherent (${rev.errors.length}):\n${rev.errors.map((e) => "  - " + e).join("\n")}\n`,
    );
    return 2;
  }

  const personaStaleNames = derivePersonaStaleNames(roles);
  const commandFiles = loadCommandFiles();
  const allowlist = new Set(MIGRATION_PENDING);

  const { findings, info } = evaluate({ registry, roleIds, commandFiles, personaStaleNames, allowlist });

  const skillsN = skillHookPoints.skillIds(registry).length;
  const filesN = commandFiles.length;
  const tracked = info.length;
  const ok = findings.length === 0;

  if (JSON_OUT) {
    console.log(JSON.stringify({
      ok,
      skills: skillsN,
      command_files: filesN,
      persona_stale_names: [...personaStaleNames].sort(),
      findings: findings.slice(0, 50),
      totalFindings: findings.length,
      info: tracked,
    }));
  } else if (ok) {
    console.log(`OK   [skill-hook-coverage] ${skillsN} skills registered, ${filesN} command files scanned, 0 gaps (${tracked} hardcodes tracked pending M1-c migration)`);
  } else {
    process.stderr.write(`FAIL [skill-hook-coverage] ${findings.length} coverage gap(s) (${skillsN} skills, ${filesN} command files):\n`);
    for (const f of findings.slice(0, 15)) process.stderr.write(`  - [${f.finding_type}] ${f.evidence}\n`);
    if (findings.length > 15) process.stderr.write(`  ... and ${findings.length - 15} more\n`);
  }
  return ok ? 0 : 1;
}

if (require.main === module) process.exit(main());

module.exports = { evaluate, derivePersonaStaleNames };
