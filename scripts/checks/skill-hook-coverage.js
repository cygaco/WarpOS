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
// HARDCODE / STALE (the live-bug catch): scan EVERY .claude/commands/**/*.md body for a
//   dispatch that hardcodes a renameable persona role (subagent_type: <name>). For each:
//     - name ∈ staleNames (a role the registry renamed AWAY via its `was` field) ->
//       `hardcoded_stale_role` (HIGH — would fail to dispatch);
//     - else name is a registry role that is ALSO a skill-hook-points key-role (a renameable
//       persona the skill SHOULD resolve at call time) AND the owning skill ∉ allowlist ->
//       `hardcoded_role`. Stable faces + generics (alpha..epsilon, general-purpose, builder,
//       fixer, stub-scaffold) are legit literal dispatches — never `hardcoded_role`.
//     - allowlist = skills migration-pending (M1-c); their hardcodes -> info (tracked). An
//       allowlisted skill with NO hardcode -> `stale_allowlist_entry` (the allowlist must not
//       rot — mirrors scan-coverage's reasonless/stale self-flagging).
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

// Skills whose persona hardcodes are M1-c prose-migration pending — tracked (info), not
// findings; the enforcer self-flags any that no longer hardcode (stale_allowlist_entry, rot).
// The 4 GROWTH skills were MIGRATED (resolve via the skill-hook registry at call time) and
// removed here; the 4 ROADMAP skills (conditional product-lead/director-of-product routing)
// remain — the next M1-c slice.
const MIGRATION_PENDING = [
  "roadmap:create", "roadmap:prioritize", "roadmap:ideas", "roadmap:next",
];
const ALLOWLIST_REASON = "M1-c prose migration pending";

// A dispatch that hardcodes a persona role: `subagent_type` followed by a role name.
const SUBAGENT_TYPE_RE = /subagent_type["'\s:=]+([a-z][a-z0-9-]+)/g;

// ── CLI flags ─────────────────────────────────────────────────────────────────

const JSON_OUT = process.argv.includes("--json");

// ── Stale-name derivation (the renamed-away names) ─────────────────────────────

/**
 * Every non-empty `was` value across the role-registry roles (the renamed-away names).
 * `was` may be a string OR an array (e.g. qa-reviewer.was = ["qa","req-reviewer","compliance"]).
 * @param {object} roleRegistryRoles  the roles{} map from role-registry.json
 * @returns {Set<string>}
 */
function deriveStaleNames(roleRegistryRoles = {}) {
  const out = new Set();
  for (const role of Object.values(roleRegistryRoles)) {
    if (!role || typeof role !== "object" || role.was == null) continue;
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
 * @param {object}        registry      the skill hook-point registry
 * @param {string[]}      roleIds       real role ids from role-registry
 * @param {object[]}      commandFiles  [{ skill, path, body }]
 * @param {Set<string>}   staleNames    renamed-away names (from `was`)
 * @param {Set<string>}   allowlist     migration-pending skill ids
 * @returns {{ findings, info }}
 */
function evaluate({ registry, roleIds, commandFiles = [], staleNames = new Set(), allowlist = new Set() }) {
  const findings = [];
  const info = [];

  // 1. REVERSE — registry coherence. Surface every error as a finding; main() maps to exit 2.
  const rev = skillHookPoints.validate(registry, roleIds);
  if (!rev.ok) {
    for (const e of rev.errors) findings.push({ finding_type: "registry_incoherent", evidence: e });
  }

  const roleIdSet = new Set(roleIds);
  // The renameable PERSONAS: registry roles that are ALSO key-roles in skill-hook-points.
  const personaRoles = new Set(
    skillHookPoints.hookRows(registry).map((r) => r.role).filter((r) => roleIdSet.has(r)),
  );

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

  // 3. HARDCODE / STALE — scan every command body for a hardcoded persona dispatch.
  //    Track which allowlisted skills actually carry a hardcode (to detect rot).
  const allowlistHit = new Set();
  for (const cf of commandFiles) {
    const allowed = allowlist.has(cf.skill);
    SUBAGENT_TYPE_RE.lastIndex = 0;
    let m;
    while ((m = SUBAGENT_TYPE_RE.exec(cf.body)) !== null) {
      const name = m[1];

      if (staleNames.has(name)) {
        // A renamed-away name — would fail to dispatch. Allowlist tracks it; otherwise HIGH.
        const f = {
          finding_type: "hardcoded_stale_role",
          skill: cf.skill,
          role: name,
          severity: "high",
          path: cf.path,
          evidence: `${cf.skill} hardcodes subagent_type: ${name} — a role the registry renamed away (stale; would fail to dispatch)`,
        };
        if (allowed) { allowlistHit.add(cf.skill); info.push(f); }
        else findings.push(f);
        continue;
      }

      if (GENERIC_ROLES.has(name)) continue; // stable face / generic — legit literal dispatch
      if (!personaRoles.has(name)) continue; // not a renameable persona — out of scope

      // A current renameable persona the skill should resolve at call time.
      const f = {
        finding_type: "hardcoded_role",
        skill: cf.skill,
        role: name,
        path: cf.path,
        evidence: `${cf.skill} hardcodes persona subagent_type: ${name} — should resolve via skill-hook-points at call time`,
      };
      if (allowed) { allowlistHit.add(cf.skill); info.push(f); }
      else findings.push(f);
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

  const staleNames = deriveStaleNames(roles);
  const commandFiles = loadCommandFiles();
  const allowlist = new Set(MIGRATION_PENDING);

  const { findings, info } = evaluate({ registry, roleIds, commandFiles, staleNames, allowlist });

  const skillsN = skillHookPoints.skillIds(registry).length;
  const filesN = commandFiles.length;
  const tracked = info.length;
  const ok = findings.length === 0;

  if (JSON_OUT) {
    console.log(JSON.stringify({
      ok,
      skills: skillsN,
      command_files: filesN,
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

module.exports = { evaluate, deriveStaleNames };
