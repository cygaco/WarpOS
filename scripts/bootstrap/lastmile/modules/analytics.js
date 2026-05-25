"use strict";
/**
 * modules/analytics.js — last-mile ANALYTICS / INSTRUMENTATION adapter. Defines
 * the required funnel + activation event plan and success/kill-continue criteria.
 * Pure; conforms to lib/adapter-contract.js.
 */

const { recommendStack } = require("../lib/profiles");

// The required event plan — every monetizable product should emit these.
const REQUIRED_EVENTS = [
  "visit_landing_page",
  "click_primary_cta",
  "sign_up",
  "complete_onboarding",
  "activation_moment", // the first time the user gets the core value
  "start_checkout",
  "complete_payment",
  "subscription_change", // upgrade / downgrade / cancel
  "core_product_action", // invite / share / export / save — the retained behavior
];

const ENV_BY_PROVIDER = {
  posthog: ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"],
  plausible: [],
  vercel: [],
  ga4: ["NEXT_PUBLIC_GA_ID"],
};

function detect(state) {
  const a = (state && state.analytics) || {};
  return {
    status: a.provider ? "present" : "absent",
    present: !!a.provider,
    provider: a.provider || null,
    evidence: a.evidence || [],
  };
}

function recommend(state, profile) {
  const existing = state && state.analytics && state.analytics.provider;
  if (existing) {
    return { choice: `${existing} (keep existing)`, rationale: "Analytics wired — ensure the required funnel events are emitted.", alternatives: [] };
  }
  const stack = recommendStack(profile, state).stack;
  return {
    choice: stack.analytics,
    rationale: "PostHog for product+funnel analytics (events, funnels, flags); Plausible for privacy-friendly traffic only.",
    alternatives: ["posthog", "plausible", "vercel-analytics", "ga4"],
  };
}

function plan(state, profile) {
  const rec = recommend(state, profile);
  const provider = (state && state.analytics && state.analytics.provider) || "posthog";
  return {
    summary: `Analytics: ${rec.choice}. Instrument the full funnel + activation so growth + kill/continue decisions are data-backed.`,
    steps: [
      "Emit the required events: " + REQUIRED_EVENTS.join(", ") + ".",
      "Define the activation moment explicitly (the first core-value event) and instrument it.",
      "Build the funnel view: visit → CTA → signup → onboarding → activation → checkout → payment.",
      "Success metrics: pick a North Star (e.g. weekly activated users) + funnel conversion targets.",
      "Kill/continue criteria: define up front what result would stop vs. continue the bet.",
      "Privacy: disclose tracking; prefer cookieless/aggregate where possible (ties to security module).",
    ],
    envVars: ENV_BY_PROVIDER[provider] || ENV_BY_PROVIDER.posthog,
    gates: [],
    tests: [
      "the primary CTA click emits click_primary_cta",
      "sign_up fires on account creation",
      "complete_payment fires from the verified payment webhook",
    ],
    template: "analytics-event-plan",
    risks: ["Unmeasured funnels make launch decisions guesswork — instrument before, not after, launch."],
    requiredEvents: REQUIRED_EVENTS,
  };
}

module.exports = { name: "analytics", title: "Analytics & Instrumentation", detect, recommend, plan, REQUIRED_EVENTS };
