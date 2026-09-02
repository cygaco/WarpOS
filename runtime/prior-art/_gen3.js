const fs = require("fs"), path = require("path"), DIR = __dirname;
const R = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
const prev = R("skill-sweep.json");   // skills[], caveats, aliases (schema v1 or v2 — both carry these)
const IND = R("_families.json");      // SECONDARY axis source of truth (Google + any company)
const V = R("_vendor.json");          // PRIMARY axis source of truth (Anthropic + OpenAI)
const VF = Object.fromEntries(V.families.map((f) => [f.family, f]));
const IF = Object.fromEntries(IND.map((f) => [f.family, f]));
const esc = (s) => String(s == null ? "" : s).replace(/\|/g, "\\|");

// v1's verdict column was "vs vendors first, industry noted". The SECONDARY axis here means
// "was ANYONE earlier, widest field" — so sleep-dream must read THEY-WERE-FIRST (Letta, 2025-04-21).
const SECONDARY_OVERRIDE = {
  "sleep-dream": { verdict: "THEY-WERE-FIRST", margin: "−356 d vs Letta sleep-time compute (2025-04-21)" },
};

// recompute family membership + first-landing straight from skills[] so this is idempotent
const byFam = {};
for (const s of prev.skills) (byFam[s.family] = byFam[s.family] || []).push(s);

const order = { "WARPOS-FIRST": 0, "INCONCLUSIVE": 1, "NO-VENDOR-ANALOG": 2, "N/A-COMPOSITE": 3, "VENDOR-FIRST": 4 };
const fams = Object.keys(byFam).map((key) => {
  const v = VF[key], ind0 = IF[key];
  if (!v) throw new Error("no vendor data for family " + key);
  if (!ind0) throw new Error("no industry data for family " + key);
  const ind = { ...ind0, ...(SECONDARY_OVERRIDE[key] || {}) };
  const list = byFam[key].slice().sort((a, b) => a.first_date.localeCompare(b.first_date));
  return {
    family: key,
    label: ind.label,
    skills: list.length,
    warpos_first_hash: list[0].first_hash,
    warpos_first_landed: list[0].first_date,
    warpos_first_skill: list[0].skill,
    keystone_skill: v.keystone,
    keystone_date: v.keystone_date,
    primary: { verdict: v.primary_verdict, margin: v.primary_margin, note: v.primary_note, anthropic: v.anthropic, openai: v.openai },
    secondary: { analog: ind.industry_analog, date: ind.industry_date, url: ind.industry_url, verdict: ind.verdict, margin: ind.margin, note: ind.note },
  };
});
fams.sort((a, b) => (order[a.primary.verdict] - order[b.primary.verdict]) || a.warpos_first_landed.localeCompare(b.warpos_first_landed));

const pv = {}, sv = {}, pvS = {}, svS = {};
for (const f of fams) {
  pv[f.primary.verdict] = (pv[f.primary.verdict] || 0) + 1;
  sv[f.secondary.verdict] = (sv[f.secondary.verdict] || 0) + 1;
  pvS[f.primary.verdict] = (pvS[f.primary.verdict] || 0) + f.skills;
  svS[f.secondary.verdict] = (svS[f.secondary.verdict] || 0) + f.skills;
}

let t1 = "| Family | # | WarpOS keystone (date) | Anthropic analog | date | OpenAI analog | date | **PRIMARY** | Margin |\n|---|---|---|---|---|---|---|---|---|\n";
for (const f of fams) {
  t1 += `| **${f.family}**<br><sub>${esc(f.label)}</sub> | ${f.skills} | \`${esc(f.keystone_skill)}\`<br>**${f.keystone_date}** | ${esc(f.primary.anthropic.feature)} | ${esc(f.primary.anthropic.date)} | ${esc(f.primary.openai.feature)} | ${esc(f.primary.openai.date)} | **${f.primary.verdict}** | ${esc(f.primary.margin)} |\n`;
}
let t2 = "| Family | **PRIMARY** (Anthropic/OpenAI) | Closest Google / industry analog | Their date | *ALSO* (widest field) | Margin |\n|---|---|---|---|---|---|\n";
for (const f of fams) {
  const u = f.secondary.url ? ` ([src](${f.secondary.url}))` : "";
  t2 += `| **${f.family}** | ${f.primary.verdict} | ${esc(f.secondary.analog)}${u} | ${esc(f.secondary.date)} | *${f.secondary.verdict}* | ${esc(f.secondary.margin)} |\n`;
}
let t3 = "", cur = null;
for (const f of fams) {
  if (f.primary.verdict !== cur) { cur = f.primary.verdict; t3 += `\n### PRIMARY: ${cur}\n`; }
  t3 += `\n#### \`${f.family}\` — ${f.label}\n\n`;
  t3 += `${f.skills} skill${f.skills === 1 ? "" : "s"} · keystone \`${f.keystone_skill}\` **${f.keystone_date}** · family first-landing \`${f.warpos_first_hash}\` ${f.warpos_first_landed} (via \`/${f.warpos_first_skill}\`)\n\n`;
  const a = f.primary.anthropic, o = f.primary.openai, s = f.secondary;
  t3 += `| Axis | Their feature | Their date | Verdict | Margin |\n|---|---|---|---|---|\n`;
  t3 += `| **Anthropic** | ${esc(a.feature)}${a.url ? ` ([src](${a.url}))` : ""} | ${esc(a.date)} | ${a.verdict} | ${esc(a.margin)} |\n`;
  t3 += `| **OpenAI** | ${esc(o.feature)}${o.url ? ` ([src](${o.url}))` : ""} | ${esc(o.date)} | ${o.verdict} | ${esc(o.margin)} |\n`;
  t3 += `| *also — Google / any company* | ${esc(s.analog)}${s.url ? ` ([src](${s.url}))` : ""} | ${esc(s.date)} | *${s.verdict}* | ${esc(s.margin)} |\n\n`;
  t3 += `**PRIMARY VERDICT: ${f.primary.verdict}** — ${esc(f.primary.margin)}\n\n${f.primary.note}\n\n`;
  t3 += `*Secondary-axis note:* ${f.secondary.note}\n`;
}
const FAMV = Object.fromEntries(fams.map((f) => [f.family, f]));
let t4 = "| Skill | Purpose | First landed | Family | **PRIMARY** | *also* | Skill-level note |\n|---|---|---|---|---|---|---|\n";
for (const s of prev.skills.slice().sort((a, b) => a.skill.localeCompare(b.skill))) {
  const f = FAMV[s.family];
  const alias = s.deprecated_alias_for ? ` **[deprecated alias → ${s.deprecated_alias_for}]**` : "";
  t4 += `| \`/${s.skill}\`${alias} | ${esc((s.purpose || "").slice(0, 120))} | \`${s.first_hash}\` · ${s.first_date} | ${s.family} | **${f.primary.verdict}** | *${f.secondary.verdict}* | ${esc(s.skill_note || "")} |\n`;
}
for (const [n, c] of [["_t1.md", t1], ["_t2.md", t2], ["_t3.md", t3], ["_t4.md", t4]]) fs.writeFileSync(path.join(DIR, n), c);

const out = {
  schema: "warpos.skill-sweep/2",
  compiled: "2026-08-28",
  revision: "v2 — restructured per operator priority: PRIMARY axis is Anthropic + OpenAI; Google/industry demoted to a secondary 'also' axis",
  repo: path.resolve(DIR, "..", ".."),
  builds_on: "runtime/prior-art/PRIOR-ART-EVIDENCE-2026-08-28.md",
  primary_axis: "Anthropic (Claude Code / Claude API / claude.ai) and OpenAI (Codex CLI+cloud+app / ChatGPT / Agents SDK / Responses API)",
  secondary_axis: "Google (Gemini CLI / ADK) and any other company — widest field",
  verdict_vocabulary: {
    "WARPOS-FIRST": "WarpOS landed the procedure before the closest Anthropic or OpenAI analog. Margin stated.",
    "VENDOR-FIRST": "Anthropic or OpenAI shipped the analog first.",
    "NO-VENDOR-ANALOG": "Neither Anthropic nor OpenAI ships anything comparable. Uncontested on the primary axis but usually VACUOUS — the vendors do not compete in that category. Read the secondary column for the real answer.",
    "INCONCLUSIVE": "A vendor analog exists but the date is unpinned, the job is materially different, or the family splits.",
    "N/A-COMPOSITE": "A WarpOS-internal composition over vendor primitives with no external analog because no external system has the structure being checked. Not a priority claim.",
  },
  caveats: (prev.caveats || []).concat([
    "PRIMARY verdicts are vs Anthropic and OpenAI only. NO-VENDOR-ANALOG is not a competitive claim — 9 of 35 families sit in a category neither vendor entered.",
    "Vendor dates are anchored on two third-party timelines (scriptbyai claude-code-timeline and codex-timeline), cross-checked against first-party pages where those exist. The timelines are secondary sources.",
  ]),
  vendor_date_reference: { anthropic: V._dates_anthropic, openai: V._dates_openai },
  totals: {
    skills: prev.skills.length,
    live_skills: prev.totals.live_skills,
    deprecated_aliases: prev.totals.deprecated_aliases,
    families: fams.length,
    families_by_primary_verdict: pv,
    skills_by_primary_verdict: pvS,
    families_by_secondary_verdict: sv,
    skills_by_secondary_verdict: svS,
  },
  deprecated_aliases: prev.deprecated_aliases,
  families: fams,
  skills: prev.skills.map((s) => ({
    skill: s.skill, purpose: s.purpose, first_hash: s.first_hash, first_date: s.first_date,
    family: s.family,
    primary_verdict: FAMV[s.family].primary.verdict,
    secondary_verdict: FAMV[s.family].secondary.verdict,
    deprecated_alias_for: s.deprecated_alias_for || null,
    skill_note: s.skill_note || null,
  })),
  no_external_analog_found: prev.no_external_analog_found,
};
fs.writeFileSync(path.join(DIR, "skill-sweep.json"), JSON.stringify(out, null, 2));
console.log("families", fams.length, "skills", out.skills.length);
console.log("PRIMARY fams  ", JSON.stringify(pv), "\nPRIMARY skills", JSON.stringify(pvS));
console.log("SECOND  fams  ", JSON.stringify(sv), "\nSECOND  skills", JSON.stringify(svS));
