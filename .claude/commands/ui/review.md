# /ui:review — Design System Compliance Audit

Read-only audit of component(s) against the consumer product design system. Reports violations without fixing them.

## Input

`$ARGUMENTS` — file path(s) or glob pattern to audit. If empty, audit all files in `src/components/`.

## Process

1. Read the design system docs:
   - `docs/01-design-system/COMPONENT_LIBRARY.md` (component catalog, variants, known issues)
   - `docs/01-design-system/COLOR_SEMANTICS.md` (color usage rules)
   - `docs/01-design-system/FEEDBACK_PATTERNS.md` (toast, loading, notification patterns)
   - `docs/01-design-system/UX_PRINCIPLES.md` (interaction principles)

2. Read the target file(s) from `$ARGUMENTS`

3. Check each file for these violations:

### Color Compliance
- Hardcoded hex values in style objects (should use `var(--token)`)
- Tailwind color utility classes (project uses CSS custom properties, not Tailwind colors)
- Unknown/undefined CSS custom property references (not in globals.css)

### Component Usage
- Raw `<button>` elements (should use `<Btn>`)
- Raw `<input>` elements (should use `<Inp>`)
- Raw `<select>` elements (should use `<Sel>`)
- Raw `<dialog>` or modal patterns (should use `<PrivacyModal>` pattern or future Radix Dialog)
- Missing component variants that need to be created

### Accessibility (WCAG 2.1 AA)
- Interactive elements without accessible names (missing aria-label, aria-labelledby, or visible text)
- Images/SVGs without alt text or role="presentation"
- Color as sole state indicator (needs icon/text pair)
- Missing focus management for dynamic content
- onClick on non-interactive elements (`<div onClick>` instead of `<button>`)

### Theme Compliance
- Gradients (not in dark corporate theme)
- Frosted glass / glassmorphism effects
- Emoji in UI text
- Generic placeholder copy ("Lorem ipsum", "Click here")
- Spacing values outside the standard scale (8/12/16/20/32px)
- Border radius values not using design tokens

### Pattern Compliance
- JS-based hover (onMouseEnter/onMouseLeave) outside existing ui/ components
- Inconsistent padding (check against COMPONENT_LIBRARY.md standards)
- Missing loading states for async operations
- Missing error states for fallible operations
- Toast/notification patterns not using Toast component

## Output

Print a structured report:

```
=== UI REVIEW: {filename} ===

COLOR: {count} violations
  - Line {N}: hardcoded hex '#ff0000' → use var(--error)
  - ...

COMPONENTS: {count} violations
  - Line {N}: raw <button> → use <Btn variant="primary">
  - ...

ACCESSIBILITY: {count} violations
  - Line {N}: <div onClick> without aria-label → use <Btn> or add role="button" + aria-label
  - ...

THEME: {count} violations
  - Line {N}: gradient background → remove, use solid var(--surface)
  - ...

PATTERNS: {count} violations
  - Line {N}: onMouseEnter hover → use CSS :hover
  - ...

SUMMARY: {total} violations ({critical} critical, {warning} warning)
```

Do NOT fix any violations. Report only. This is a read-only audit.
