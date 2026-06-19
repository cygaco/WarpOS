<!-- generated 2026-04-30 by Phase 3G — keep `id` and section names stable, edit content freely -->
# Contract: WORKSPACE

- **id:** WORKSPACE
- **owner:** onboarding
- **introducedIn:** 2026-04-30
- **status:** active
- **version:** 1.0.0
- **changeType:** none
- **used by:** onboarding, plan-generation, launch-run, dashboard

## 1. Shape

```typescript
interface WorkspaceState {
  userId: string;
  onboardingProgress: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;  // 7-step onboarding gate
  savedPlans: Array<{
    id: string;
    title: string;
    s3Key: string;
  }>;
  launchActionHistory: Array<{
    actionId: string;
    status: "PLAN" | "PREP" | "LAUNCH" | "HELD";
    executedAt: string;
  }>;
  profileVector: Record<string, number>;  // Embedding vector for audience/segment matching
}
```

## 2. Producers

- `services/backend/src/routes/workspace.ts` (workspace CRUD)
- `services/backend/src/routes/onboarding.ts` (progress incrementor)

## 3. Consumers

- `src/app/dashboard/page.tsx` (determines PLAN / PREP / LAUNCH layout)
- `src/components/workspace/*` (UI rendering)
- `services/backend/src/services/launch-run.ts`

## 4. Breaking changes

- Altering the 0-7 `onboardingProgress` scale (adds / removes steps without migration)
- Changing launch-action status enums from the PLAN / PREP / LAUNCH domain model
- Changing `profileVector` from a key-value embedding shape to an array

## 5. Required tests

- State machine transitions for `launchActionHistory` statuses
- Enforced validation that `profileVector` meets expected dimensionality bounds
- Schema validation mapping exact JSON response fields to frontend types

## 6. Drift gate

- `services/backend/src/routes/workspace.ts`
- `packages/shared/types/workspace.ts`

## 7. Versioning and compatibility

- Patch: documentation or display-only field.
- Minor: optional field with default values and no permission change.
- Major: onboarding progress scale, launch-action status, saved plan shape, or profile vector semantics change.
- On any version bump, notify: onboarding, plan-generation, launch-run, dashboard.
