# UI Component Kit Pattern

Lightweight, product-agnostic UI components. CSS custom properties for theming, no Tailwind runtime dependency.

## Components (17 files)

| Component       | Purpose                         | Props                            |
| --------------- | ------------------------------- | -------------------------------- |
| `Btn`           | Button with variants            | variant, size, loading, disabled |
| `Card`          | Container with shadow/border    | children, className              |
| `Spin`          | Loading spinner                 | size, color                      |
| `CopyBtn`       | Copy-to-clipboard button        | text, label                      |
| `Inp`           | Text input with label/error     | label, error, value, onChange    |
| `Sel`           | Select dropdown                 | options, value, onChange         |
| `ProgressSteps` | Step indicator bar              | steps, current, onClick          |
| `TabBar`        | Tab navigation                  | tabs, active, onChange           |
| `MultiSelect`   | Multi-option selector           | options, selected, onChange      |
| `LocCombo`      | Location combobox (typeahead)   | value, onChange, suggestions     |
| `EduCard`       | Education entry card            | education, onEdit, onDelete      |
| `CharCount`     | Character counter for textareas | current, max                     |
| `AutoBadge`     | Status badge                    | status, label                    |
| `PrivacyModal`  | Privacy/terms modal             | open, onClose                    |
| `ErrorBoundary` | React error boundary            | children, fallback               |
| `Toast`         | Toast notification              | message, type, duration          |

## Barrel export

```typescript
// src/components/ui/index.ts
export { Btn } from "./Btn";
export { Card } from "./Card";
export { Spin } from "./Spin";
export { CopyBtn } from "./CopyBtn";
export { Inp } from "./Inp";
export { Sel } from "./Sel";
export { ProgressSteps } from "./ProgressSteps";
export { TabBar } from "./TabBar";
export { MultiSelect } from "./MultiSelect";
export { LocCombo } from "./LocCombo";
export { EduCard } from "./EduCard";
export { CharCount } from "./CharCount";
export { AutoBadge } from "./AutoBadge";
export { PrivacyModal } from "./PrivacyModal";
export { ErrorBoundary } from "./ErrorBoundary";
```

## Theming via CSS custom properties

```css
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-error: #dc2626;
  --color-success: #16a34a;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

Products override these variables for their own theme. No Tailwind needed.

## Import pattern

```typescript
import { Btn, Card, Spin } from "@/components/ui";
```

Always use the barrel export, never import from individual files directly.

## Key decisions

- **No Tailwind runtime**: CSS custom properties are lighter and don't require build-time processing
- **Barrel export**: Single import path, tree-shaking handles unused components
- **Product-agnostic**: Components don't know about product domain — they're pure UI primitives
- **ErrorBoundary included**: Every product needs error boundaries — ship it in the kit

## First implementation

Example project: `src/components/ui/`
