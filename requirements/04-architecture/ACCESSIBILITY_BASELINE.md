# Accessibility Baseline

> WarpOS framework template. Generic. Each project SHOULD audit and
> extend.

WCAG 2.1 AA is the floor. Every interactive surface must meet the
following baseline before merging to main.

## Keyboard navigation

Every action reachable by keyboard. Tab order matches visual order.
No keyboard traps. Skip-to-content link on every page.

## Focus states

Visible focus ring on every interactive element. Custom focus styles
must meet 3:1 contrast against the surrounding background.

## Semantic labels

Every input has an associated label. Icon-only buttons have
`aria-label`. Landmarks (`main`, `nav`, `aside`) used correctly.
Headings form a coherent outline (no skipped levels).

## Contrast

Body text meets 4.5:1 against its background. Large text and UI
controls meet 3:1. Tested in light AND dark theme.

## Form errors

Errors announced to assistive tech via `aria-live` or `aria-invalid`.
Error message linked via `aria-describedby`. Inline message in addition
to color-only signaling.

## Screen-reader state

Loading, success, and error states announced via live region. Modal
dialogs trap focus and restore on close. Route changes announce the
new page title.

## Verification

Automated: `axe-core` runs in CI on every PR. Manual: keyboard-only
walkthrough each release. Real screen-reader pass (NVDA / VoiceOver)
each minor version.
