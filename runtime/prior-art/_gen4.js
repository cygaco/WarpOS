const fs = require("fs"), path = require("path"), DIR = __dirname;
const j = JSON.parse(fs.readFileSync(path.join(DIR, "skill-sweep.json"), "utf8"));
const SEARCHED = {
  "memory:verify": "auto-memory verification, memory ground-truth checking, stale agent memory correction (Anthropic auto memory 2026-02-26; Codex project memories 2026-07-21)",
  "beta:mine": "LLM-as-a-judge, preference learning from user decisions, agent decision mining",
  "beta:integrate": "judgment-model update from mined precedent, constitutional feedback loops",
  "session:dump": "AI session handoff format, Claude Code desktop session handoff (2026-02-20), Cline Memory Bank, anti-instruction / context-not-command handoff contracts",
  "session:read": "cross-session agent messaging, agent inbox, A2A, Agent Teams messaging, Anthropic cross-session SendMessage/ListAgents (2026-08-07), Codex threads",
  "session:write": "same as /session:read",
  "scan:role-parity": "role registry parity, agent catalog drift detection, org-map bijection enforcement",
  "scan:greek-office-parity": "naming-convention bijection enforcers, identity-scheme validators",
  "scan:scan-coverage": "aggregator/member drift, check-suite self-inventory, lint-rule coverage assertions",
  "scan:patterns": "cross-run failure pattern mining, automation proposal from incident history",
  "scan:security-binding-lane": "binding reviewer verdicts, un-overridable security gates, approval-authority governance",
  "epic:fold": "scope-change classification taxonomies, requirement-conflict detection, non-destructive spec merge",
  "guides:integrate": "docs into agent context (CLAUDE.md imports, AGENTS.md, Agent Skills, Cursor @Docs, Devin Knowledge, Backstage TechDocs), prompt-fragment injection, idempotent doc placement ledgers",
  "knowledge:integrate": "knowledge-domain wiring into agent specs, RAG-vs-placement, consumer-spec injection ledgers",
  "warp:flag": "template drift feedback, cruft/Copier upstream channels, downstream-to-upstream gap reporting",
  "warp:reconcile": "same as /warp:flag",
  "bootstrap:lastmile": "prototype to revenue, launch readiness automation, app-store/SSO day-zero prerequisites, Lovable/Bolt/v0/Replit",
  "portfolio:run": "cross-repo agent invocation, multi-repo agent session isolation, Backstage/Nx multi-project ops",
  "discover:orphaned": "abandoned work detection, stale branch/TODO sweep, forgotten task discovery",
  report: "ELI5 engineering reports, non-technical stakeholder status generation",
  "hooks:friction": "developer-friction measurement, hook interruption cost, pre-commit friction telemetry",
  "oneshot:improve": "self-modifying check suites, meta-learning preflight, autoresearch loops",
  "etc:author": "prompt authoring with eval pack, claude plugin eval, /skill-doctor, promptfoo, DSPy, LangSmith evals, Anthropic prompt improver",
  "etc:eval": "prompt evaluation frameworks, decision records, promptfoo/DeepEval/DSPy",
};
const esc = (s) => String(s == null ? "" : s).replace(/\|/g, "\\|");
const rows = j.skills.filter((s) => s.skill_note && /[Nn]o analog found|no dated analog|no dated product analog|N\/A-COMPOSITE|WARPOS-FIRST|INCONCLUSIVE/.test(s.skill_note));
let out = "| Skill | First landed | Family PRIMARY | What was searched | Outcome |\n|---|---|---|---|---|\n";
for (const s of rows) {
  out += `| \`/${s.skill}\` | \`${s.first_hash}\` · ${s.first_date} | ${s.primary_verdict} | ${esc(SEARCHED[s.skill] || "—")} | ${esc(s.skill_note)} |\n`;
}
fs.writeFileSync(path.join(DIR, "_t5.md"), out);
console.log("no-analog rows", rows.length);
