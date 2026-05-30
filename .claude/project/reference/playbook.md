# The Playbook

A living collection of **plays** — hard-won operating principles for taking products from idea to PMF (the [product lifecycle](product-lifecycle.md)). Each play is a reusable judgment: a named belief with the reasoning and an example. The Director of Product and Director of QA agents consult this; the operator grows it over time via `/playbook:add`.

> **Status: living.** Add plays as they're earned. Keep each play short, opinionated, and example-anchored. Sections are extensible — add a new one only when no existing section fits.

---

## QA & Testing

### Product Priority over Severity

**You have limited time even with AI — so focus testing and fixes on the highest *product* impact, not the highest raw severity.**

Typical QA ranks bugs by **severity** = amount of degradation, with a crash as the worst. That's the wrong objective for a company in the phases *before scaling*. Instead rank by **product priority** = impact on **the users you care about most** (your target audience / Golden Users), and on those most at-risk (Vulnerable Users) — and ignore most of the rest, **within two floors: legal compliance, and a still-acceptable overall UX**.

**Worked example.** A *crash* in the account-deletion flow — as long as it's recoverable and the user can still complete the deletion (which may be a legal requirement to offer, depending on region) — is a **lower**-priority fix than a non-crash bug that genuinely hurts the experience of a user in your **target audience**. Why: the user deleting their account is *already on their way out*; the targeted-audience user will be *pushed out* if their experience isn't fixed — even though it isn't a crash. Severity says "fix the crash first." Product priority says "fix the thing that loses the user you're trying to keep."

**How to apply.** Classify by *who is hurt* and *how much you care about keeping them*, then by degradation — in that order. A "crash" is not automatically P0. Maintain legal/compliance and a baseline overall UX as non-negotiable floors; above those floors, spend your limited test-and-fix budget where it protects and wins the audience you're building for.

*(Earmarked for the Director of QA — encoded on the Director of Product too. Source: operator, 2026-05-29. Lineage: the Golden/Silver-feature + Golden/Vulnerable-user prioritization from the operator's pre-scale QA practice.)*

---

## Product

*(plays about product decisions — add via `/playbook:add`)*

---

## GTM, Launch & Community

*(plays about go-to-market, launch, and community — add via `/playbook:add`)*

---

## Engineering

*(plays about how to build — add via `/playbook:add`)*
