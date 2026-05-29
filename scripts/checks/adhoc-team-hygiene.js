#!/usr/bin/env node
// scan:adhoc-team-hygiene — read-only probe for cross-session accretion in
// persistent agent teams (W-21).
//
// /mode:adhoc spawns a team under ~/.claude/teams/<name>/config.json with a
// lead + Beta/Gamma + builders. When a NEW session reuses the same team name
// without reconciling, Claude Code appends fresh members alongside the stale
// ones: you get `Beta (β)-2`, `Gamma (γ)-2`, builders pinned to a dead branch,
// and members whose prompts reference a leadSessionId that is no longer the
// team's current lead. SendMessage(to:"Beta (β)") then becomes ambiguous and
// the team carries dead weight across sessions.
//
// This check flags two accretion signatures per team — it does NOT mutate
// anything (reconcile is /mode:adhoc's job; Alpha wires this into /warp:health):
//   1. -N-suffixed member names    (e.g. "Beta (β)-2") — duplicate accretion
//   2. session drift               — a member's prompt references a session id
//                                    that is NOT the team's current leadSessionId
//
// Exit 0 = clean (or no teams); 1 = accretion found.

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const JSON_OUT = process.argv.includes("--json");
const TEAMS_DIR = path.join(os.homedir(), ".claude", "teams");

// A trailing "-<digits>" on a member name is Claude Code's de-dup suffix when a
// name already exists in the team — the tell-tale of accretion. We match it on
// the END of the name so legitimate names containing digits aren't flagged.
const SUFFIX_RE = /-\d+$/;

// UUID v4-ish session id, as written into member prompts (e.g. "leadSessionId"
// references, "Joining team X", branch/session lines). Used to detect a member
// whose prompt was minted under a different lead session than the team's
// current one.
const SESSION_ID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function listTeamConfigs(dir) {
  let names;
  try {
    names = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return []; // no teams dir → nothing to check
  }
  const out = [];
  for (const d of names) {
    if (!d.isDirectory()) continue;
    const cfg = path.join(dir, d.name, "config.json");
    if (fs.existsSync(cfg)) out.push({ name: d.name, file: cfg });
  }
  return out;
}

function inspectTeam(teamFile) {
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(teamFile, "utf8"));
  } catch (e) {
    return { unreadable: true, error: e.message, findings: [] };
  }
  const members = Array.isArray(cfg.members) ? cfg.members : [];
  const leadSession = cfg.leadSessionId || null;
  const findings = [];

  for (const m of members) {
    const name = m.name || m.agentId || "<unnamed>";

    // 1. -N-suffixed name → duplicate accretion.
    if (SUFFIX_RE.test(name)) {
      findings.push({
        type: "duplicate-suffix",
        member: name,
        detail: `name carries a -N de-dup suffix — a prior same-named member was never reconciled`,
      });
    }

    // 2. Session drift — the member's prompt references session id(s) that are
    //    not the team's current leadSessionId. A member with NO session ref in
    //    its prompt (e.g. the lead itself, or a builder whose prompt names no
    //    session) is not flagged — absence of a ref is not drift.
    if (leadSession && typeof m.prompt === "string" && m.prompt.length) {
      const refs = m.prompt.match(SESSION_ID_RE) || [];
      const foreign = [...new Set(refs.map((r) => r.toLowerCase()))].filter(
        (r) => r !== leadSession.toLowerCase(),
      );
      if (foreign.length) {
        findings.push({
          type: "session-drift",
          member: name,
          detail: `prompt references session ${foreign
            .slice(0, 2)
            .join(", ")} ≠ team leadSessionId ${leadSession}`,
        });
      }
    }
  }

  return {
    unreadable: false,
    leadSession,
    memberCount: members.length,
    findings,
  };
}

function main() {
  const teams = listTeamConfigs(TEAMS_DIR);
  const report = [];
  let totalFindings = 0;
  let unreadable = 0;

  for (const t of teams) {
    const res = inspectTeam(t.file);
    if (res.unreadable) {
      unreadable++;
      report.push({ team: t.name, unreadable: true, error: res.error });
      continue;
    }
    if (res.findings.length) {
      totalFindings += res.findings.length;
      report.push({
        team: t.name,
        memberCount: res.memberCount,
        leadSessionId: res.leadSession,
        findings: res.findings,
      });
    }
  }

  const ok = totalFindings === 0;

  if (JSON_OUT) {
    console.log(
      JSON.stringify({
        ok,
        teamsScanned: teams.length,
        teamsWithFindings: report.filter((r) => !r.unreadable).length,
        unreadable,
        findingCount: totalFindings,
        teams: report,
      }),
    );
    process.exit(ok ? 0 : 1);
  }

  if (teams.length === 0) {
    console.log("OK   [adhoc-team-hygiene] no teams under ~/.claude/teams");
    process.exit(0);
  }
  if (ok) {
    console.log(
      `OK   [adhoc-team-hygiene] ${teams.length} team(s) scanned, no accretion`,
    );
    process.exit(0);
  }

  console.error(
    `FAIL [adhoc-team-hygiene] ${totalFindings} accretion finding(s) across ${report.filter((r) => !r.unreadable).length} team(s):`,
  );
  for (const r of report) {
    if (r.unreadable) {
      console.error(`  - ${r.team}: config.json unreadable (${r.error})`);
      continue;
    }
    console.error(`  - ${r.team} (${r.memberCount} members):`);
    for (const f of r.findings) {
      console.error(`      [${f.type}] ${f.member} — ${f.detail}`);
    }
  }
  console.error(
    "\nThese teams accreted members across sessions (W-21). Reconcile before reusing:\n" +
      "  • In /mode:adhoc, reconcile-before-spawn: reuse existing Beta/Gamma rather than re-adding.\n" +
      "  • Or start a fresh team name for a new session.\n" +
      "This check is read-only — it mutates nothing.",
  );
  process.exit(1);
}

main();
