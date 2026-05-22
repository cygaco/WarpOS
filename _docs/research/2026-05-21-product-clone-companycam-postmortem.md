# `/product:clone` companycam.com Run — Methodology Postmortem

**Date:** 2026-05-21
**Target:** CompanyCam, https://companycam.com/
**Deliverable:** `_docs/clones/companycam/companycam.clone.md`
**Run capture:** 12 sources (11 ok + 1 failed), 22 verbatim quotes, 13 gaps in the target product, 14 capitalize-able opportunities

**Headline finding:** the deliverable was usable but built on a corpus that's roughly 30% of what was reachable with a less timid skill. 16 methodology gaps identified.

**3 highest-leverage fixes have graduated** to `ROADMAP.md § Next: Skill Reliability` for the next `/product:clone` iteration:

1. **Capterra pagination** — fetch pages 2-N (gap #4 below)
2. **App Store + Play Store reviews** — first-class review-source classes (gap #5 below)
3. **Raise internal-URL cap from 8 to 12** — expose `--max-internal-urls` flag, prioritize trust/legal/changelog (gap #8 below)

The rest are captured in this postmortem for future iterations.

---

## Full gap inventory

### A — Interactive surfaces never engaged (highest leverage, lowest effort)

1. **No AI-agent / chat-widget interaction.** WebFetch is static-only; never clicks an Intercom/Drift/proprietary chat widget. Competitors' onboarding chatbots, sales-qual flows, and AI-assistant UIs are unreachable. **Fix:** add an optional Playwright-MCP layer (visual-review agent) that probes the rendered page for chat widgets and either engages them or flags presence. Behind a `--interactive` flag so default stays cheap.

2. **No visual product evidence.** Zero screenshots, zero UI walkthroughs. Reviews say what users *experience*; screenshots show what *is*. **Fix:** same Playwright layer — snapshot 4-8 marketing-site screens + any publicly-accessible product preview to `_raw/screens/`.

### B — Source-host coverage is incomplete

3. **G2 403 has no fallback.** G2 blocks unauthenticated WebFetch. We log `source_failed` and continue, but lose the highest-density B2B-software review host. **Fix:** cascade fallback — archive.org (Wayback) → Bing cache → search-result mining of `site:g2.com "<name>" review`. Same pattern for other blockers.

4. **Capterra pagination ignored.** Page 1 = 25 reviews; pages 2-N untouched. **Fix:** detect "page=2" URL pattern in fetched body and fetch up to `--max-review-pages` (default 3). **[GRADUATED TO ROADMAP]**

5. **App Store + Play Store reviews skipped entirely.** CompanyCam claims 25,000 App Store + 6,700 Play Store reviews — by 100× the densest VOC corpus. We didn't even attempt either. **Fix:** add iTunes RSS feed (`itunes.apple.com/us/rss/customerreviews/id=<id>/json`) and Play Store scrape paths as first-class review-source classes. **[GRADUATED TO ROADMAP]**

6. **Video transcript ingestion absent.** yt-dlp not installed; product-walkthrough YouTube videos unprobed. **Fix:** ship a yt-dlp install check + a `--video-search "<name> demo"` opt-in WebSearch pass that surfaces the top 3 demo videos for transcript ingestion when yt-dlp is present.

7. **Reddit / X social-listening searches returned zero.** No fallback search strategy. **Fix:** try multiple query shapes (`"<name>" reddit`, `r/<likely-subreddit> <name>`, `site:reddit.com <name> -inurl:bot`) before declaring empty.

### C — Per-page depth is shallow

8. **Internal-URL cap of 8 is too tight.** Couldn't fetch `/faq`, `/reviews`, `/trust-center`, `/resources/blog`, `/changelog`, `/portfolio-features`, and 11 of 12 case studies. **Fix:** raise default to 12, expose `--max-internal-urls` flag, and prioritize trust/legal/changelog pages alongside the current pricing/features set. **[GRADUATED TO ROADMAP]**

9. **One case study of twelve fetched.** Apple Roofing only; the other 11 have hard ROI metrics ($50k/yr savings, 36 hrs/mo saved, 10× ROI) that strengthen feature-list scoring and JTBD evidence. **Fix:** a second-level discovery pass within `/resources/case-studies` that auto-fetches each linked case study under a separate budget (`--max-case-studies <n>`).

10. **Competitor matrix unbuilt.** G2's "Top 10 alternatives" page surfaced in WebSearch but was never fetched. **Fix:** auto-fetch the `g2.com/products/<slug>/competitors/alternatives` URL pattern when the run targets a G2-indexed product; extract the alternatives list into a new `## 08 — Competitive Landscape` section.

### D — Cross-source reconciliation absent

11. **Defector claims not reconciled against actual pricing.** Fieldd's page claimed CompanyCam costs "$24-$36/user/mo" — actual is $79/3 users (≈$26/seat at Pro entry) + $29/extra seat. We surfaced the defector quote without flagging the math discrepancy. **Fix:** a post-extraction reconciliation pass that cross-checks claims in defector/competitor pages against numbers in cached pricing pages; emit a `## Reconciliation Notes` subsection when deltas exceed a threshold.

### E — Strategic / enterprise signals unsampled

12. **Trust-center / security posture unprobed.** SOC2, HIPAA, GDPR, data-residency claims matter for enterprise competitive positioning. **Fix:** auto-prioritize `/trust-center`, `/security`, `/privacy`, `/legal` into the internal-URL set when the run targets a B2B SaaS (heuristic: has `/pricing` + has `/enterprise` link).

13. **No technographics / funding / traffic data.** Crunchbase, SimilarWeb, LinkedIn headcount, news mentions. Frames real market position vs. what marketing site claims. **Fix:** add a `## 09 — Market Position` section sourced from WebSearch against `<name> crunchbase`, `<name> linkedin company`, `<name> funding`.

14. **Changelog unparsed.** Recent ship velocity, deprecations, beta-graduation signals are roadmap intel about where the competitor is going next. **Fix:** when `/changelog` or `/whats-new` exists, fetch it and extract a 90-day delta timeline.

15. **No competitive moat enumeration.** Listed CompanyCam's 60+ integrations but didn't ask "which is exclusive?" or "which alternatives lack each?" **Fix:** extend the feature-list extraction pass to flag features as `moat: exclusive|differentiated|table-stakes|gap` based on cross-source signal.

### F — Cache integrity

16. **Cache stores model-summarized text, not raw HTML.** Presence-check verifies quotes against an LLM summary of the page, not the raw source. A fabrication that survives WebFetch's own summarization pass would also pass our check. **Fix:** stash raw HTML alongside the summary in `_raw/<sha>.raw.html`; run presence-check against raw, not summary. WebFetch's tool contract may not expose raw — needs a different fetcher (curl + readability) for the raw lane.

---

## Priority ranking by leverage × effort

- **Ship in next `/product:clone` iteration (low effort, high signal):** items 4, 5, 8, 9, 10, 12, 14. *(Items 4, 5, 8 already graduated to ROADMAP.)*
- **Design first, then ship (medium effort, high signal):** items 1, 2, 3, 11, 15, 16.
- **Opt-in flags (high effort, situational signal):** items 6, 7, 13.

## Why this postmortem matters

The /product:clone skill is the same pattern any "audit a competitor / target product end-to-end" skill faces: static fetch + URL cap + summarized cache biases toward marketing-site surface area and away from the higher-signal corpus that lives behind interactive widgets, app stores, video, and pagination. Solving the 16 gaps here informs the design of any future competitive-research or product-discovery skill.
