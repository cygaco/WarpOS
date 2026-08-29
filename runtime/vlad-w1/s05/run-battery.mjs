// S-VLADW1-05 DESIGN-PHASE NEAR-MISS BATTERY
// Runs every bound rule against the SHIPPED predicate at 6a105f2 AND against the predicate
// AS IT WILL BE FIXED. CONTROLS FIRST — a battery whose controls do not go RED proves nothing.
//
// The "FIXED" column does NOT reimplement the lint's matcher. It drives the REAL shipped
// matcher with the fix's transform applied to the input, which is behaviourally what "move
// the fold inside the one shared transform" does for every caller. Reimplementing the pattern
// is how the first draft of this battery broke: its own controls went GREEN.
//
// Mutates NOTHING. Reads the shipped module; writes nothing into the tree.

const ENGINE = "file:///C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane/engine";
const m = await import(`${ENGINE}/scripts/checks/custody-claim-lint.js`);
const { containsStatusToken, resemblesBindableLeadIn, ASSERTED_STATUS_TOKEN } = m;

const ASSERTED = ASSERTED_STATUS_TOKEN;
if (!ASSERTED) { console.error("FATAL: ASSERTED_STATUS_TOKEN not exported — refusing to guess the token."); process.exit(1); }
console.log("token under test: " + JSON.stringify(ASSERTED) + "\n");

// ── THE PROPOSED FIXES, simulated over the REAL matcher ────────────────────
// FIX A (S4-2(c)): the emphasis strip moves INSIDE the shared transform, so the status-token
// comparison gets it too. Simulated by stripping emphasis from the input before the real call.
const stripEmphasis = (s) => String(s).replace(/[*_`~]+/g, "");
const tokAS = (s) => containsStatusToken(s, ASSERTED);
const tokFIX = (s) => containsStatusToken(stripEmphasis(s), ASSERTED);

// FIX B (S4-1b): refuse-not-skip extended to every block prefix on the LEAD-IN path.
// Simulated by stripping the prefix class before the real resemblance call.
const PREFIX_FIX = /^\s*(?:#{1,6}\s+|\|\s*|<p>\s*|<!--[^>]*-->\s*|["'(\[]\s*|[\u2022\u2023\u25E6]\s*|Note:\s*)+/;
// FIX C (S4-1a): coverage widened to the letters the map lacks (simulated vendored table).
const EXTRA_CONFUSABLES = new Map([
  ["\u04CF", "l"], ["\u03B7", "n"], ["\u03B3", "g"], ["\u0433", "r"], ["\u0261", "g"],
  ["\u04BB", "h"], ["\u0138", "k"], ["\u03C5", "u"], ["\u0442", "t"], ["\u0500", "d"],
]);
const widenConfusables = (s) => String(s).split("").map((c) => EXTRA_CONFUSABLES.get(c) ?? c).join("");
const leadAS = (s) => resemblesBindableLeadIn(s) !== null;
const leadFIX = (s) => resemblesBindableLeadIn(widenConfusables(String(s).replace(PREFIX_FIX, ""))) !== null;

const rows = [];
const add = (rule, kind, label, asIs, fixed) => rows.push({ rule, kind, label, asIs, fixed });
const R = (b) => (b ? "RED" : "GREEN");

// ── R3 — status-token separation. CONTROLS FIRST. ──────────────────────────
add("R3", "CONTROL", "exact token", R(tokAS(ASSERTED)), R(tokFIX(ASSERTED)));
add("R3", "CONTROL", "whole token bolded", R(tokAS(`**${ASSERTED}**`)), R(tokFIX(`**${ASSERTED}**`)));
const R3_NEAR = [
  ["**ASSERTED** \u2014 NOT VERIFIED", "bold on first half"],
  ["*ASSERTED* \u2014 *NOT VERIFIED*", "italic on both halves"],
  ["ASS**ERTED** \u2014 NOT VERIFIED", "bold mid-word"],
  ["_ASSERTED_ \u2014 NOT VERIFIED", "underscore emphasis"],
  ["ASSERTED \u2014 NOT **VERIFIED**", "bold on second half"],
  ["`ASSERTED` \u2014 NOT VERIFIED", "code span"],
  ["ASSERTED **\u2014** NOT VERIFIED", "bold on the separator"],
  ["~~ASSERTED~~ \u2014 NOT VERIFIED", "strikethrough"],
];
for (const [s, label] of R3_NEAR) add("R3", "near-miss", label, R(tokAS(s)), R(tokFIX(s)));
add("R3", "disclosed-residual", "comma separator (disclosed open)", R(tokAS("ASSERTED, NOT VERIFIED")), R(tokFIX("ASSERTED, NOT VERIFIED")));
for (const [s, label] of [
  ["the item is asserted, not verified", "prose w/ comma"],
  ["we asserted the claim and later verified it", "prose, words apart"],
  ["an assertion that was not independently verified by us", "prose, no adjacency"],
]) add("R3", "over-refusal", label, R(tokAS(s)), R(tokFIX(s)));

// ── R1 — lead-in resemblance. CONTROLS FIRST. ──────────────────────────────
for (const [s, label] of [
  ["**Ceiling \u2014 x", "plain, em-dash"],
  ["**A9 \u2014 x", "A-n form"],
  ["- **Ceiling \u2014 x", "list prefix (already handled)"],
  ["> **Ceiling \u2014 x", "blockquote (already handled)"],
  ["**C\u0435iling \u2014 x", "Cyrillic e (MAPPED today)"],
]) add("R1", "CONTROL", label, R(leadAS(s)), R(leadFIX(s)));

for (const p of ["# ", "## ", "### ", "#### ", "##### ", "| ", "<p>", '"', "(", "[", "Note: ", "\u2022 "]) {
  const s = `${p}**Ceiling \u2014 x`;
  add("R1", "S4-1b near-miss", `prefix ${JSON.stringify(p)}`, R(leadAS(s)), R(leadFIX(s)));
}
for (const [name, ch, pos] of [
  ["Cyrillic PALOCHKA U+04CF -> l", "\u04CF", 3],
  ["Greek ETA U+03B7 -> n", "\u03B7", 5],
  ["Greek GAMMA U+03B3 -> g", "\u03B3", 6],
]) {
  const w = "Ceiling".split(""); w[pos] = ch;
  const s = `**${w.join("")} \u2014 x`;
  add("R1", "S4-1a near-miss", name, R(leadAS(s)), R(leadFIX(s)));
}
// OVER-REFUSAL on the lead-in path: ordinary prose and headings must NOT become candidates.
for (const [s, label] of [
  ["## Proven", "a real section heading"],
  ["The ceiling of this clause is stated below.", "prose using the keyword"],
  ["**Status:** PROVEN", "a bolded non-keyword lead-in"],
]) add("R1", "over-refusal", label, R(leadAS(s)), R(leadFIX(s)));

// ── report ────────────────────────────────────────────────────────────────
const w = [6, 20, 40, 8];
const pad = (s, n) => String(s).padEnd(n);
console.log(pad("rule", w[0]) + pad("kind", w[1]) + pad("authoring", w[2]) + pad("AS-IS", w[3]) + "FIXED");
console.log("-".repeat(82));
for (const r of rows) console.log(pad(r.rule, w[0]) + pad(r.kind, w[1]) + pad(r.label, w[2]) + pad(r.asIs, w[3]) + r.fixed);

const controls = rows.filter((r) => r.kind === "CONTROL");
const asIsRed = controls.filter((r) => r.asIs === "RED").length;
const fixRed = controls.filter((r) => r.fixed === "RED").length;
console.log(`\nCONTROLS FIRST — ${controls.length} controls: AS-IS ${asIsRed}/${controls.length} RED, FIXED ${fixRed}/${controls.length} RED`);
if (asIsRed !== controls.length || fixRed !== controls.length) {
  console.log("BATTERY INVALID — a control did not fire in one of the columns. Nothing below proves anything.");
  process.exit(1);
}
const sum = (rule, kind, col, val) => rows.filter((r) => r.rule === rule && r.kind === kind && r[col] === val).length;
const n = (rule, kind) => rows.filter((r) => r.rule === rule && r.kind === kind).length;
console.log(`R3 near-miss  GREEN as-is (the S4-2(c) gap): ${sum("R3","near-miss","asIs","GREEN")}/${n("R3","near-miss")}`);
console.log(`R3 near-miss  RED under FIX A:               ${sum("R3","near-miss","fixed","RED")}/${n("R3","near-miss")}`);
console.log(`R1 S4-1b      GREEN as-is:                   ${sum("R1","S4-1b near-miss","asIs","GREEN")}/${n("R1","S4-1b near-miss")}`);
console.log(`R1 S4-1b      RED under FIX B:               ${sum("R1","S4-1b near-miss","fixed","RED")}/${n("R1","S4-1b near-miss")}`);
console.log(`R1 S4-1a      GREEN as-is:                   ${sum("R1","S4-1a near-miss","asIs","GREEN")}/${n("R1","S4-1a near-miss")}`);
console.log(`R1 S4-1a      RED under FIX C:               ${sum("R1","S4-1a near-miss","fixed","RED")}/${n("R1","S4-1a near-miss")}`);
const over = rows.filter((r) => r.kind === "over-refusal");
console.log(`OVER-REFUSAL  still GREEN under the fixes:   ${over.filter((r) => r.fixed === "GREEN").length}/${over.length}`);
const disc = rows.filter((r) => r.kind === "disclosed-residual");
console.log(`DISCLOSED     unchanged by the fixes:        ${disc.filter((r) => r.asIs === r.fixed).length}/${disc.length}`);
