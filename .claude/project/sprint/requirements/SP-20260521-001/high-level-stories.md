# High-Level Stories — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`
**PRD:** `prd.md`

> `H-N` ids enforced by `requirement-format-guard.js`.

## H-1 — Unified namespace

**As** the user
**I want** every product-related action under a single `/portfolio:*` namespace
**So that** I never have to think "is this `/product:` or `/products:`" — there's only one place to look.

Linked granular stories: S-1, S-9, S-10
Linked requirements: R-3, R-4

## H-2 — Multi-terminal parallel products

**As** the user
**I want** to keep my WarpOS terminal as my home base and open each active product in its own terminal window
**So that** I can work on dreamteams in one window, companycam in another, and a third in WarpOS itself — all in parallel, no state collisions.

Linked granular stories: S-4
Linked requirements: R-5, R-6

## H-3 — Scaffold a new private product in one shot

**As** the user
**I want** to scaffold a new private product repository and have WarpOS installed in it with a single command
**So that** new dreamteams- or competitor-clone-style work starts on a fresh, properly-configured substrate without manual setup steps.

Linked granular stories: S-5
Linked requirements: R-8, R-10

## H-4 — Adopt existing brief into a real product

**As** the user
**I want** to take an existing brief or clone (like the dreamteams brief sitting in canonical) and turn it into a registered private repo
**So that** strategy work that started as a free-floating artifact can become a real, version-controlled, team-shareable product.

Linked granular stories: S-5, S-11
Linked requirements: R-9

## H-5 — Cross-product dispatch from the console

**As** the user
**I want** to run any WarpOS skill against any registered product from inside the WarpOS terminal without `cd`-ing
**So that** the home-base console actually controls the portfolio.

Linked granular stories: S-7
Linked requirements: R-6

## H-6 — Portfolio status at a glance

**As** the user
**I want** a single command that shows every registered product's WarpOS version, last commit, dirty state, current sprint, and GitHub remote status
**So that** I can audit my whole portfolio without opening 8 different terminals.

Linked granular stories: S-6
Linked requirements: R-11

## H-7 — Privacy is structural, not vigilance

**As** the operator
**I want** canonical WarpOS to never accidentally leak product briefs into its public history
**So that** I can run `/portfolio:bootstrap newthing` from canonical without fear of pushing strategy to a public repo.

Linked granular stories: S-11
Linked requirements: R-7

## H-8 — Team collaborators can pull and contribute

**As** the team-lead
**I want** my private products backed up via private GitHub repos that my collaborators can clone
**So that** dreamteams etc. can become real team-buildable products without losing the WarpOS substrate they were created with.

Linked granular stories: S-5
Linked requirements: R-10
