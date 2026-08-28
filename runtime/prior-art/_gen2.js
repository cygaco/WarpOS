const fs = require("fs"), path = require("path"), DIR = __dirname;
const j = JSON.parse(fs.readFileSync(path.join(DIR, "skill-sweep.json"), "utf8"));
const order = { "WARPOS-FIRST": 0, "INCONCLUSIVE": 1, "N/A-COMPOSITE": 2, "THEY-WERE-FIRST": 3 };
const fams = j.families.slice().sort((a, b) => (order[a.verdict] - order[b.verdict]) || a.warpos_first_landed.localeCompare(b.warpos_first_landed));
let out = "";
let cur = null;
for (const f of fams) {
  if (f.verdict !== cur) { cur = f.verdict; out += `\n### ${cur}\n`; }
  out += `\n**\`${f.family}\`** — ${f.label} · ${f.skills} skill${f.skills === 1 ? "" : "s"} · first landed \`${f.warpos_first_hash}\` **${f.warpos_first_landed}** (via \`/${f.warpos_first_skill}\`)\n\n`;
  out += `- Closest vendor analog: ${f.analog} — **${f.their_date}**${f.their_url ? ` ([src](${f.their_url}))` : ""}\n`;
  out += `- Closest industry analog: ${f.industry_analog} — **${f.industry_date}**${f.industry_url ? ` ([src](${f.industry_url}))` : ""}\n`;
  out += `- Margin: ${f.margin}\n`;
  out += `- ${f.note}\n`;
}
fs.writeFileSync(path.join(DIR, "_frag-notes.md"), out);

// no-analog section
const rows = j.skills.filter((s) => s.skill_note && /No analog found|no analog found|no dated analog|no dated product analog|N\/A-COMPOSITE|WARPOS-FIRST|INCONCLUSIVE/.test(s.skill_note));
let na = "| Skill | First landed | What was searched | Outcome |\n|---|---|---|---|\n";
const SEARCHED = {
  "memory:verify": "auto-memory verification, memory ground-truth checking, stale agent memory correction",
  "beta:mine": "LLM-as-a-judge, preference learning from user decisions, agent decision mining",
  "beta:integrate": "judgment-model update from mined precedent, constitutional feedback loops",
  "session:dump": "AI session handoff format, Cline Memory Bank, anti-instruction / context-not-command handoff contracts",
  "session:read": "cross-session agent messaging, agent inbox, A2A, Agent Teams messaging, durable agent message board",
  "session:write": "cross-session agent messaging, agent inbox, A2A, Agent Teams messaging, durable agent message board",
  "scan:role-parity": "role registry parity, agent catalog drift detection, org-map bijection enforcement",
  "scan:greek-office-parity": "naming-convention bijection enforcers, identity-scheme validators",
  "scan:scan-coverage": "aggregator/member drift, check-suite self-inventory, lint-rule coverage assertions",
  "scan:patterns": "cross-run failure pattern mining, automation proposal from incident history",
  "scan:security-binding-lane": "binding reviewer verdicts, un-overridable security gates, approval-authority governance",
  "epic:fold": "scope-change classification taxonomies, requirement-conflict detection, non-destructive spec merge",
  "guides:integrate": "docs into agent context (Cursor @Docs, Devin Knowledge, Windsurf), Backstage TechDocs, prompt-fragment injection, idempotent doc placement ledgers",
  "knowledge:integrate": "knowledge-domain wiring into agent specs, RAG-vs-placement, consumer-spec injection ledgers",
  "warp:flag": "template drift feedback, cruft/Copier upstream channels, downstream-to-upstream gap reporting",
  "warp:reconcile": "template drift feedback, cruft/Copier upstream channels, downstream-to-upstream gap reporting",
  "bootstrap:lastmile": "prototype to revenue, launch readiness automation, app-store/SSO day-zero prerequisites, Lovable/Bolt/v0/Replit",
  "portfolio:run": "cross-repo agent invocation, multi-repo agent session isolation, Backstage/Nx multi-project ops",
  "discover:orphaned": "abandoned work detection, stale branch/TODO sweep, forgotten task discovery",
  report: "ELI5 engineering reports, non-technical stakeholder status generation",
  "hooks:friction": "developer-friction measurement, hook interruption cost, pre-commit friction telemetry",
  "oneshot:improve": "self-modifying check suites, meta-learning preflight, autoresearch loops",
  "etc:author": "prompt authoring with eval pack, promptfoo, DSPy, LangSmith evals, Anthropic prompt improver",
  "etc:eval": "prompt evaluation frameworks, decision records, promptfoo/DeepEval/DSPy",
};
for (const s of rows) {
  na += `| \`/${s.skill}\` | \`${s.first_hash}\` · ${s.first_date} | ${SEARCHED[s.skill] || "—"} | ${s.skill_note.replace(/\|/g, "\\|")} |\n`;
}
fs.writeFileSync(path.join(DIR, "_frag-noanalog.md"), na);
console.log("notes fams", fams.length, "no-analog rows", rows.length);
