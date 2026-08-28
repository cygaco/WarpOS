const fs = require("fs");
const path = require("path");
const DIR = __dirname;
const skills = JSON.parse(fs.readFileSync(path.join(DIR, "_skill-fam.json"), "utf8"));
const fams = JSON.parse(fs.readFileSync(path.join(DIR, "_families.json"), "utf8"));
const FAM = Object.fromEntries(fams.map((f) => [f.family, f]));

const ALIASES = {
  "check:all": "/scan:full",
  "check:framework-purity": "/scan:framework-purity",
  "check:framework-views-fresh": "/scan:framework-views-fresh",
  "check:install": "/scan:install",
  "commit:both": "/commit:land",
  turbo: "/session:turbo",
  "warp:sync": "/warp:update",
};

// per-skill distinct notes (skill is materially different from its family verdict)
const SKILL_NOTES = {
  "memory:verify": "No analog found for verifying an agent's own auto-memory against code/disk/git ground truth — but it presupposes vendor auto-memory (2026-02), so no priority.",
  "beta:mine": "INCONCLUSIVE at skill level — mining the operator's own decision history to update a judge; closer to preference learning than LLM-as-judge, no dated product analog found.",
  "beta:integrate": "INCONCLUSIVE at skill level — writes mined precedent back into the judgment model; no dated product analog found.",
  "session:dump": "Distinct: carries explicit ANTI-instructions and fences past session progression as context-not-command. No analog found for the anti-instruction contract.",
  "session:read": "Core of the INCONCLUSIVE cross-session-inbox case.",
  "session:write": "Core of the INCONCLUSIVE cross-session-inbox case.",
  "scan:role-parity": "N/A-COMPOSITE — fail-closed role bijection across org map, dispatch catalog, and team-guard. No external analog.",
  "scan:greek-office-parity": "N/A-COMPOSITE — naming bijection enforcer (Greek call-sign IFF President's-office membership). No external analog.",
  "scan:scan-coverage": "N/A-COMPOSITE — aggregator self-inventory; every member skill delegated or excluded WITH A REASON. No external analog.",
  "scan:patterns": "INCONCLUSIVE at skill level — diagnoses a recurring pattern then PROPOSES the preventing automation; behaves like the enforcement-debt family.",
  "scan:security-binding-lane": "No analog found — asserts a reviewer FAIL is structurally un-overridable by the dispatching lead (governance, not scanning).",
  "epic:fold": "No product analog found for the 14-class taxonomy + refuse-to-silently-overwrite-a-stable-commitment contract.",
  "guides:integrate": "WARPOS-FIRST (uncontested, niche) — deterministic, idempotent, ledgered doc→consumer-agent-spec placement at a declared anchor. Every vendor analog INDEXES docs instead.",
  "knowledge:integrate": "WARPOS-FIRST (uncontested, niche) — same placement-ledger contract for LIBRARY/STORE knowledge domains.",
  "warp:flag": "INCONCLUSIVE — upstream gap channel from a downstream product back to the framework; cruft/Copier propagate downstream only.",
  "warp:reconcile": "INCONCLUSIVE — consumer side of the same upstream gap channel.",
  "bootstrap:lastmile": "No dated analog found for the prototype→monetizable last-mile procedure; the prompt→app half is Lovable/Bolt/v0/Replit territory.",
  "portfolio:run": "INCONCLUSIVE — run a skill against another product repo in a fresh subprocess, never retargeting the current session. No analog found.",
  "discover:orphaned": "No analog found — sweeps NEXT.md, runtime notes, branches, untracked files, TODOs, plans for ABANDONED work.",
  report: "No analog found — ELI5, tl;dr-first, watch-outs-always reporting aimed at a non-technical operator.",
  "hooks:friction": "No analog found — measures what a hook costs the operator in interruptions and acts on it.",
  "oneshot:improve": "Self-modification loop: the preflight suite edits its own check skills from gaps found during runs.",
  "etc:author": "Authors a prompt artifact together with a sibling eval-pack; promptfoo (2023) / DSPy (2023) own the author-then-evaluate loop earlier.",
  "etc:eval": "Emits a validated decision_record against the eval-pack; promptfoo/DSPy earlier.",
  "sleep:deep": "The flagship case. Ran in production 2026-04-22 and 2026-04-25, both before the 2026-05-06 Anthropic announcement.",
  "sleep:quick": "Same lineage as /sleep:deep (NREM consolidation + glymphatic cleanup only).",
};

const byFam = {};
for (const s of skills) (byFam[s.family] = byFam[s.family] || []).push(s);

const famRows = fams.map((f) => {
  const list = (byFam[f.family] || []).slice().sort((a, b) => a.first_date.localeCompare(b.first_date));
  const first = list[0];
  return {
    ...f,
    skills: list.length,
    warpos_first_landed: first ? first.first_date : null,
    warpos_first_hash: first ? first.first_hash : null,
    warpos_first_skill: first ? first.skill : null,
  };
});
famRows.sort((a, b) => a.warpos_first_landed.localeCompare(b.warpos_first_landed));

const verdictCounts = {};
const skillVerdictCounts = {};
for (const f of famRows) {
  verdictCounts[f.verdict] = (verdictCounts[f.verdict] || 0) + 1;
  skillVerdictCounts[f.verdict] = (skillVerdictCounts[f.verdict] || 0) + f.skills;
}

// ---- markdown fragments ----
const esc = (s) => (s || "").replace(/\|/g, "\\|");
let famTable =
  "| Family | # | WarpOS first-landed | Closest vendor analog | Closest industry analog | Their date | Verdict | Margin |\n|---|---|---|---|---|---|---|---|\n";
for (const f of famRows) {
  famTable += `| **${f.family}** — ${esc(f.label)} | ${f.skills} | \`${f.warpos_first_hash}\` · ${f.warpos_first_landed} | ${esc(f.analog)} | ${esc(f.industry_analog)} | ${esc(f.their_date)} / ${esc(f.industry_date)} | **${f.verdict}** | ${esc(f.margin)} |\n`;
}

const allSkills = skills.slice().sort((a, b) => a.skill.localeCompare(b.skill));
let skillTable =
  "| Skill | Purpose | First landed | Family | Inherited verdict | Skill-level note |\n|---|---|---|---|---|---|\n";
for (const s of allSkills) {
  const f = FAM[s.family];
  const alias = ALIASES[s.skill] ? ` **[deprecated alias → ${ALIASES[s.skill]}]**` : "";
  const note = SKILL_NOTES[s.skill] ? esc(SKILL_NOTES[s.skill]) : "";
  skillTable += `| \`/${s.skill}\`${alias} | ${esc((s.purpose || "").slice(0, 130))} | \`${s.first_hash}\` · ${s.first_date} | ${s.family} | ${f.verdict} | ${note} |\n`;
}

const noAnalog = Object.entries(SKILL_NOTES)
  .filter(([, v]) => /No analog found|no analog found|no dated analog|no dated product analog|N\/A-COMPOSITE|WARPOS-FIRST/.test(v))
  .map(([k]) => k);

fs.writeFileSync(path.join(DIR, "_frag-fam.md"), famTable);
fs.writeFileSync(path.join(DIR, "_frag-skills.md"), skillTable);

const out = {
  schema: "warpos.skill-sweep/1",
  compiled: "2026-08-28",
  repo: "C:\\Users\\Vlad\\Desktop\\Claude\\Projects\\WarpOS",
  builds_on: "runtime/prior-art/PRIOR-ART-EVIDENCE-2026-08-28.md (verdicts and vendor dates reused verbatim where a family maps to a pair it already established)",
  caveats: [
    "Repo history begins 2026-03-02; anything a vendor shipped before that is vendor-first by construction.",
    "45 skills first land at cd37d410 (2026-04-12), the Jobzooka extraction commit — they were built EARLIER, in a private repo, and that is not provable here.",
    "Skills are Claude Code slash commands; hooks are Claude Code hooks; subagents are Claude Code subagents. The substrate is vendor-first and no priority is claimed on it.",
    "Git dates are author-supplied and every commit checked is unsigned.",
    "Family verdicts are INHERITED by their skills; per-skill notes flag the cases where the skill is materially different from its family.",
  ],
  totals: {
    skills: skills.length,
    live_skills: skills.length - Object.keys(ALIASES).length,
    deprecated_aliases: Object.keys(ALIASES).length,
    families: famRows.length,
    families_by_verdict: verdictCounts,
    skills_by_inherited_verdict: skillVerdictCounts,
  },
  deprecated_aliases: ALIASES,
  families: famRows,
  skills: allSkills.map((s) => ({
    skill: s.skill,
    purpose: s.purpose,
    first_hash: s.first_hash,
    first_date: s.first_date,
    family: s.family,
    inherited_verdict: FAM[s.family].verdict,
    deprecated_alias_for: ALIASES[s.skill] || null,
    skill_note: SKILL_NOTES[s.skill] || null,
  })),
  no_external_analog_found: noAnalog,
};
fs.writeFileSync(path.join(DIR, "skill-sweep.json"), JSON.stringify(out, null, 2));
console.log("families", famRows.length, "skills", skills.length);
console.log("families_by_verdict", JSON.stringify(verdictCounts));
console.log("skills_by_verdict", JSON.stringify(skillVerdictCounts));
console.log("no_analog list", noAnalog.length);
