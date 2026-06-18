# Jobzooka — Color Semantics

This document defines the CSS custom properties and their semantic meanings. Colors are not just values — they carry meaning about state, hierarchy, and user action.

---

## Theme: Dark Corporate

Jobzooka uses a dark theme with warm undertones. The palette is built around deep reds/browns for backgrounds, bright orange for primary actions, and lime green for success states.

---

## Core Colors

### Backgrounds

| Variable        | Value     | Meaning                                                                 |
| --------------- | --------- | ----------------------------------------------------------------------- |
| `--bg`          | `#0b0303` | Page background. Deep near-black with warm red undertone.               |
| `--surface`     | `#141010` | Card/panel background. Slightly lighter than page.                      |
| `--surface-alt` | `#1e1818` | Alternate surface for contrast (e.g., hover states, nested containers). |

### Text

| Variable         | Value     | Meaning                                                             |
| ---------------- | --------- | ------------------------------------------------------------------- |
| `--text`         | `#f0eded` | Primary text. Off-white, warm.                                      |
| `--text-muted`   | `#9a9494` | Secondary/helper text. Used for labels, subtitles, disabled states. |
| `--text-inverse` | `#0b0303` | Text on light backgrounds (e.g., text on primary button).           |

### Brand / Primary Action

| Variable          | Value     | Meaning                                                                                                               |
| ----------------- | --------- | --------------------------------------------------------------------------------------------------------------------- |
| `--primary`       | `#ff5a17` | Primary action color. Bright orange. Used for: primary buttons, active phase pills, focus rings, progress indicators. |
| `--primary-text`  | `#ffffff` | Text on primary backgrounds.                                                                                          |
| `--primary-hover` | `#e64e12` | Darker orange for hover state on primary elements.                                                                    |

### Secondary / Info

| Variable           | Value                      | Meaning                                                      |
| ------------------ | -------------------------- | ------------------------------------------------------------ |
| `--secondary`      | `#d4a054`                  | Gold/amber. Currently defined but rarely used in components. |
| `--secondary-text` | `#0b0303`                  | Text on secondary backgrounds.                               |
| `--accent`         | `#d4a054`                  | Alias for secondary. Used in info states.                    |
| `--accent-text`    | `#0b0303`                  | Text on accent backgrounds.                                  |
| `--info`           | `#d4a054`                  | Info state color (gold).                                     |
| `--info-light`     | `rgba(212, 160, 84, 0.08)` | Info background tint.                                        |
| `--info-border`    | `rgba(212, 160, 84, 0.25)` | Info border.                                                 |

### Borders & Focus

| Variable         | Value     | Meaning                             |
| ---------------- | --------- | ----------------------------------- |
| `--border`       | `#2a2424` | Default border color. Subtle, warm. |
| `--border-focus` | `#ff5a17` | Focus ring color (matches primary). |

---

## Status Colors

### Success (Lime Green)

| Variable           | Value                      | Meaning                                                                                            |
| ------------------ | -------------------------- | -------------------------------------------------------------------------------------------------- |
| `--success`        | `#acd229`                  | Success/completed state. Lime green. Used for: done checkmarks, completed phases, unlocked labels. |
| `--success-light`  | `rgba(172, 210, 41, 0.1)`  | Success background tint.                                                                           |
| `--success-border` | `rgba(172, 210, 41, 0.25)` | Success border.                                                                                    |

### Warning (Amber)

| Variable           | Value                    | Meaning                                                                                  |
| ------------------ | ------------------------ | ---------------------------------------------------------------------------------------- |
| `--warning`        | `#eab308`                | Warning/in-progress state. Amber/yellow. Used for: low rocket balance, caution messages. |
| `--warning-light`  | `rgba(234, 179, 8, 0.1)` | Warning background tint.                                                                 |
| `--warning-border` | `rgba(234, 179, 8, 0.3)` | Warning border.                                                                          |

### Error (Red)

| Variable         | Value                    | Meaning                                                                                                  |
| ---------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `--error`        | `#ef4444`                | Error/destructive state. Standard red. Used for: error messages, required field markers, danger buttons. |
| `--error-light`  | `rgba(239, 68, 68, 0.1)` | Error background tint.                                                                                   |
| `--error-border` | `rgba(239, 68, 68, 0.3)` | Error border.                                                                                            |

---

## Specialized Colors

### Resume Tags

| Variable            | Value                       | Meaning                         |
| ------------------- | --------------------------- | ------------------------------- |
| `--tag-full`        | `#d4a054`                   | Full/master resume tag. Gold.   |
| `--tag-full-bg`     | `rgba(212, 160, 84, 0.12)`  | Master resume tag background.   |
| `--tag-general`     | `#4b8bf5`                   | General resume tag. Blue.       |
| `--tag-general-bg`  | `rgba(75, 139, 245, 0.12)`  | General resume tag background.  |
| `--tag-targeted`    | `#b06be8`                   | Targeted resume tag. Purple.    |
| `--tag-targeted-bg` | `rgba(176, 107, 232, 0.12)` | Targeted resume tag background. |

### Magic / AI

| Variable     | Value                       | Meaning                              |
| ------------ | --------------------------- | ------------------------------------ |
| `--magic`    | `#b06be8`                   | AI/generated content accent. Purple. |
| `--magic-bg` | `rgba(176, 107, 232, 0.08)` | AI content background tint.          |

---

## Sizing & Rounding

| Variable        | Value    | Meaning                                       |
| --------------- | -------- | --------------------------------------------- |
| `--radius`      | `4px`    | Default border radius (small).                |
| `--radius-lg`   | `8px`    | Large border radius (cards, buttons, inputs). |
| `--radius-full` | `9999px` | Full rounding (pills, toggles).               |

---

## Shadows

| Variable      | Value                        | Meaning                              |
| ------------- | ---------------------------- | ------------------------------------ |
| `--shadow`    | `0 1px 2px rgba(0,0,0,0.3)`  | Subtle card shadow.                  |
| `--shadow-lg` | `0 4px 12px rgba(0,0,0,0.4)` | Elevated shadow (modals, dropdowns). |

---

## Typography

| Variable         | Value                                           | Meaning                                        |
| ---------------- | ----------------------------------------------- | ---------------------------------------------- |
| `--font-body`    | `"Inter", system-ui, sans-serif`                | Body text font.                                |
| `--font-display` | `"Inter Tight", "Inter", system-ui, sans-serif` | Display/heading font (tighter letter spacing). |

---

## Semantic Usage Rules

1. **Primary orange (`--primary`)** = "do this" — the main action the user should take
2. **Success green (`--success`)** = "done" — completed, achieved, unlocked
3. **Warning amber (`--warning`)** = "attention" — low balance, caution, in-progress
4. **Error red (`--error`)** = "problem" — errors, required fields, destructive actions
5. **Muted text (`--text-muted`)** = "secondary" — helper text, disabled, less important
6. **Info gold (`--info`)** = "notice" — informational, non-urgent callouts
7. **Purple (`--magic`)** = "AI-generated" — content created by the system

---

## Known Issues (Flagged for Regen)

1. `--secondary` and `--accent` are identical (`#d4a054`) — one should be removed
2. `--magic` and `--tag-targeted` are identical (`#b06be8`) — potentially confusing
3. Several variables defined but unused in components (see UI audit)
