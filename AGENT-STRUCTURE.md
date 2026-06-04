# WarpOS — Your Agent Company

> Plain-language map of who's who. Snapshot: 2026-06-03. (Source files at the bottom.)

---

## In three lines

It's a **company you run.** **You're the Founder & CEO** — direction + the big, irreversible calls. **Alex is your President** — the AI who runs the company day-to-day. Below Alex: three **departments**, plus a **shared knowledge** layer everyone draws from.

---

## The org chart

```
                              YOU — Founder & CEO
                                       │
                              ALEX — President
                          faces:  α run · β check · γδε deliver
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
   ζ DIRECTOR OF             η DIRECTOR OF                   ι DIRECTOR OF
      PRODUCT                  ENGINEERING                     MARKETING
   ├ κ Product Lead         ├ Frontend Lead                 ├ ξ Growth Lead
   ├ μ Design Lead          │    ├ FE Builder               └ Conversion Lead
   └ θ Quality Lead         │    └ FE Reviewer
      owns experience       ├ Backend Lead
      judges:               │    ├ BE Builder
      qa · design-quality   │    └ BE Reviewer
      · visual-review       └ Security Lead
                                 ├ Security Builder
                                 └ Security Reviewer
                         every Reviewer's verdict is BINDING —
                         the Lead can't override a FAIL

   ══ SHARED KNOWLEDGE — everyone contributes & draws from it ════════════
   λ  audience truth (who they are) · brand voice & copy (how we speak)
      · design principles · live state-of-record
```

---

## Alex — one person, three faces

**Alex is the President.** "Alex" is his name (the hidden true-name — call him Alex anytime); "President" is his role. He shows up in three **faces** by mode — a face is a *mode of one person*, not a separate identity:

| Face | What Alex is doing |
|---|---|
| **α** | **running it** — turning your ideas into plans, dispatching the work |
| **β** | **checking it** — the independent second opinion ("is this wise?") |
| **γ / δ / ε** | **delivering it** — γ a feature · δ a whole app · ε a sprint |

> Why β is its own face: *you can't be your own second opinion.* The face that makes a call can't also judge it. (For quick throwaway work you skip β — that's "solo mode.")

---

## The departments (the colleagues — *not* Alex)

### 🟦 Product — *what to build, for whom, is it good* (ζ Director of Product)
- **κ Product Lead** — the spec: requirements, stories, acceptance criteria, backlog.
- **μ Design Lead** — the experience: UI/UX, flows, the mockup the build follows.
- **θ Quality Lead** — the verdict on *quality* — does it work **and** is it good to use. Owns the experience judges: **qa** (does it work), **design-quality** + **visual-review** (does the UI hold up). *(Design Lead authors; Quality Lead judges — verdict binding.)*

### 🟩 Engineering — *how it's built well* (η Director of Engineering)
Three self-contained pods. Each **Lead** owns a builder + a reviewer:
- **Frontend Lead** → **FE Builder** (writes the screens) + **FE Reviewer** (grades them)
- **Backend Lead** → **BE Builder** (writes the engine) + **BE Reviewer** (grades it)
- **Security Lead** → **Security Builder** (builds hardening) + **Security Reviewer** (redteam — attacks it)

**The guard that keeps pods honest:** the Reviewer's verdict is **binding** — the Lead (and η) **cannot override a FAIL**, and can't hand-pick a friendly reviewer (roster is fixed). Independence comes from the *binding verdict*, not from separating the org. *(Default: the Builder fixes its own flagged issues — no separate Fixer.)*

### 🟧 Marketing — *the message & how it grows* (ι Director of Marketing)
- **ξ Growth Lead** — paid traffic; scores products SCALE/TEST/SKIP; LTV:CAC; scales winners.
- **Conversion Lead** — converting pages (copy + design): one job, one CTA, hook→proof→CTA.
- The Director owns **message coherence** (does it cohere with avatar / proof / beliefs / objections).

---

## The shared knowledge (λ) — everyone contributes & draws

Not a department — the company's **brain**, fed by everyone and read by everyone:
- **Audience truth** — who the customers are (segment-level, source-attributed, no PII).
- **Brand voice & copy** — how we speak: voice, hooks, customer language, copy principles.
- **Design principles** + a **live state-of-record** (what the product *actually is* now).

This is why there's no standalone "Research" or "Copy" box — that knowledge belongs to the whole company. Product grounds in it (what to build), Marketing grounds in it (who/what message), Alex grounds in it (strategy). The *craft* of writing lives where it ships (Conversion, Growth, Product UI), all from this one voice.

---

## The one rule that makes it trustworthy

**Nobody grades their own homework.** No one renders a verdict on work *they authored*, and no boss can override a reviewer's FAIL. That single rule — enforced by **binding verdicts**, not by org walls — is what makes a green light actually *mean* something. It's why reviewers can sit inside a pod (they grade, they didn't author) but a Lead can't overrule them.

---

## Today vs. the plan

- **Today — real & running:** Alex (α/β) + delivery faces (γ adhoc, δ oneshot), builders + reviewers, the directors and their teams all exist and work.
- **The plan — agreed, design-locked, not built:** the **ε** sprint face + its hook-point registry, the shared **knowledge** layer (audience + voice + state), the pod/Lead naming, and the formal display-name switch. Full plan: `DUMP.md`. Design spec: `runtime/notes/agent-org-sprint-mode-spec.md`.

---

## Where each piece lives

| Piece | File |
|---|---|
| Alex's faces (α/β/γ/δ) | `.claude/agents/00-alex/{alpha,beta,gamma,delta}.md` |
| Build crew (one-feature / from-scratch) | `.claude/agents/01-adhoc/` · `.claude/agents/02-oneshot/` |
| Departments & teams | `.claude/agents/03-managers/` |
| Machine-readable org | `.claude/agents/03-managers/_org/org-map.json` |
| Department rulebooks | `.claude/agents/03-managers/_principles/registry.json` |
| The full plan | `DUMP.md` |
| Org / sprint design spec | `runtime/notes/agent-org-sprint-mode-spec.md` |
