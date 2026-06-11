"use strict";
/**
 * modules/analytics.js - last-mile ANALYTICS / INSTRUMENTATION adapter.
 *
 * S-PF-01 makes the scaffold telemetry seam the canonical base. Lastmile
 * enriches that base with provider/funnel events; it must not install a
 * competing tracker or rename the canonical lifecycle vocabulary.
 */

const { recommendStack } = require("../lib/profiles");

const CANONICAL_BASE_EVENTS = [
  "signup",
  "onboarding_complete",
  "activation",
  "core_action",
  "retention_return",
  "checkout",
];

const ENRICHMENT_EVENTS = [
  "visit_landing_page",
  "click_primary_cta",
  "start_checkout",
  "complete_payment",
  "subscription_change",
  "experiment_exposure",
  "activation_definition_change",
];

const REQUIRED_EVENTS = CANONICAL_BASE_EVENTS;

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
    return {
      choice: `${existing} (keep existing)`,
      rationale:
        "Analytics wired - confirm it enriches the scaffold telemetry seam without renaming canonical events.",
      alternatives: [],
    };
  }
  const stack = recommendStack(profile, state).stack;
  return {
    choice: stack.analytics,
    rationale:
      "PostHog for product+funnel analytics; the scaffold seam remains the canonical event source.",
    alternatives: ["posthog", "plausible", "vercel-analytics", "ga4"],
  };
}

function confirmOrReviseActivationDefinition(current, opts = {}) {
  const emit = typeof opts.emit === "function" ? opts.emit : () => {};
  const revision = opts.revision || null;
  if (!revision) {
    return {
      ...current,
      lastmileConfirmed: true,
    };
  }

  const next = {
    ...current,
    ...revision,
    provenance: revision.provenance || "revised-at-lastmile",
    confidence: revision.confidence == null ? current.confidence : revision.confidence,
    lastmileConfirmed: true,
  };

  if (revision.predicate && revision.predicate !== current.predicate) {
    emit("activation_definition_change", {
      oldPredicate: current.predicate,
      newPredicate: revision.predicate,
      oldProvenance: current.provenance,
      newProvenance: next.provenance,
    });
  }

  return next;
}

function plan(state, profile) {
  const rec = recommend(state, profile);
  const provider = (state && state.analytics && state.analytics.provider) || "posthog";
  return {
    summary: `Analytics: ${rec.choice}. Confirm activation and enrich the canonical scaffold telemetry seam.`,
    steps: [
      "Treat the scaffold lifecycle events as canonical: " + CANONICAL_BASE_EVENTS.join(", ") + ".",
      "Confirm or revise the activation definition at lastmile; emit activation_definition_change when revised.",
      "Layer enrichment events for traffic, funnel, payment, subscription, and experiments: " + ENRICHMENT_EVENTS.join(", ") + ".",
      "Build the funnel view from canonical base + enrichment: visit -> CTA -> signup -> onboarding -> activation -> checkout -> payment.",
      "Success metrics: pick a North Star (e.g. weekly activated users) + funnel conversion targets.",
      "Kill/continue criteria: define up front what result would stop vs. continue the bet.",
      "Privacy: disclose tracking; prefer cookieless/aggregate where possible (ties to security module).",
    ],
    envVars: ENV_BY_PROVIDER[provider] || ENV_BY_PROVIDER.posthog,
    gates: [],
    tests: [
      "signup fires on account creation through track()",
      "activation fires only with the confirmed activation definition",
      "complete_payment is emitted as enrichment from the verified payment webhook",
    ],
    template: "analytics-event-plan",
    risks: ["Unmeasured funnels make launch decisions guesswork - instrument before, not after, launch."],
    canonicalBaseEvents: CANONICAL_BASE_EVENTS,
    enrichmentEvents: ENRICHMENT_EVENTS,
    requiredEvents: REQUIRED_EVENTS,
  };
}

module.exports = {
  name: "analytics",
  title: "Analytics & Instrumentation",
  detect,
  recommend,
  plan,
  confirmOrReviseActivationDefinition,
  CANONICAL_BASE_EVENTS,
  ENRICHMENT_EVENTS,
  REQUIRED_EVENTS,
};
