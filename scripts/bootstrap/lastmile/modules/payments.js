"use strict";
/**
 * modules/payments.js — last-mile PAYMENTS / MONETIZATION adapter. Stripe by
 * default. Builds the FUNNEL not just checkout, and treats unverified webhooks as
 * a first-class risk (the recurring last-mile gap). Live mode is a hard approval
 * gate. Pure; conforms to lib/adapter-contract.js.
 */

function detect(state) {
  const p = (state && state.payments) || {};
  if (!p.provider) return { status: "absent", present: false, provider: null, webhookVerified: false, evidence: p.evidence || [] };
  // present-but-partial when payments exist without verified webhooks
  return {
    status: p.webhookVerified ? "present" : "partial",
    present: true,
    provider: p.provider,
    webhookVerified: !!p.webhookVerified,
    evidence: p.evidence || [],
  };
}

function recommend(state, profile) {
  const existing = state && state.payments && state.payments.provider;
  if (existing) {
    return {
      choice: `${existing} (keep existing)`,
      rationale: "Payment provider already wired — complete the funnel + verify webhooks rather than switch.",
      alternatives: [],
    };
  }
  // Stripe default; Connect for marketplaces.
  const choice = profile === "marketplace" ? "stripe-connect" : "stripe";
  return {
    choice,
    rationale: "Stripe is the boring, well-documented default. Connect when the product pays third parties (marketplace).",
    alternatives: ["stripe", "stripe-connect", "paddle (merchant-of-record)", "lemonsqueezy (MoR)"],
  };
}

function plan(state, profile) {
  const rec = recommend(state, profile);
  const p = (state && state.payments) || {};
  const webhookGap = p.provider && !p.webhookVerified;
  const steps = [
    "Choose the model: subscription / one-time / freemium / trial / usage / credit / waitlist — match the value delivery.",
    "Pricing page: clear tiers, the recommended plan highlighted, annual/monthly toggle if subscription.",
    "Upgrade prompts: in-product nudges at the value moment (not nagware).",
    "Checkout: Stripe Checkout (hosted) for speed; Payment Links for a no-code start.",
    "Success/cancel states: confirm entitlement on success; recover gracefully on cancel.",
    "Billing portal: Stripe Customer Portal for self-serve plan changes + invoices.",
    "Entitlement checks: gate features on the SERVER from verified subscription state, never client-only.",
    "Webhook handling: verify the signature (stripe.webhooks.constructEvent) and grant entitlements ONLY on verified events.",
    "Refund/cancellation policy copy: plain-language, linked from pricing + checkout.",
  ];
  if (webhookGap) {
    steps.unshift("FIX (security): payment webhook signature is NOT verified — add stripe.webhooks.constructEvent before trusting any event. Forgeable events can grant free entitlements.");
  }
  return {
    summary: `Monetization: ${rec.choice}. Build the funnel (pricing → checkout → portal → entitlements → verified webhooks), not just a checkout button.${webhookGap ? " ⚠ webhook signature unverified — fix before launch." : ""}`,
    steps,
    envVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
    gates: ["stripe-live"],
    tests: [
      "test-mode checkout completes + grants entitlement",
      "webhook signature verification rejects an unsigned/forged event",
      "entitlement is denied without a verified subscription",
      "billing portal opens for an existing customer",
    ],
    template: "monetization-plan",
    risks: webhookGap
      ? ["UNVERIFIED webhooks: forged events can grant paid features for free — highest-priority monetization fix."]
      : ["Verify in Stripe TEST mode before any live-mode switch (live mode is a human-approval gate)."],
  };
}

module.exports = { name: "payments", title: "Payments & Monetization", detect, recommend, plan };
