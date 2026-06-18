<!-- generated 2026-04-30 by Phase 3G — keep `id` and section names stable, edit content freely -->
# Contract: WORKSPACE

- **id:** WORKSPACE
- **owner:** onboarding
- **introducedIn:** 2026-04-30
- **status:** active
- **version:** 1.0.0
- **changeType:** none
- **used by:** onboarding, resume-generation, auto-apply, dashboard

## 1. Shape

```typescript
interface WorkspaceState {
  userId: string;
  onboardingProgress: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;  // 7-step onboarding gate
  savedResumes: Array<{
    id: string;
    title: string;
    s3Key: string;
  }>;
  applicationHistory: Array<{
    jobId: string;
    status: "READY" | "AIM" | "FIRE" | "REJECTED";
    appliedAt: string;
  }>;
  profileVector: Record<string, number>;  // Embedding vector for skill matching
}
```

## 2. Producers

- `services/backend/src/routes/workspace.ts` (workspace CRUD)
- `services/backend/src/routes/onboarding.ts` (progress incrementor)

## 3. Consumers

- `src/app/dashboard/page.tsx` (determines READY / AIM / FIRE layout)
- `src/components/workspace/*` (UI rendering)
- `services/backend/src/services/auto-apply.ts`

## 4. Breaking changes

- Altering the 0-7 `onboardingProgress` scale (adds / removes steps without migration)
- Changing application status enums from the READY / AIM / FIRE domain model
- Changing `profileVector` from a key-value embedding shape to an array

## 5. Required tests

- State machine transitions for `applicationHistory` statuses
- Enforced validation that `profileVector` meets expected dimensionality bounds
- Schema validation mapping exact JSON response fields to frontend types

## 6. Drift gate

- `services/backend/src/routes/workspace.ts`
- `packages/shared/types/workspace.ts`

## 7. Versioning and compatibility

- Patch: documentation or display-only field.
- Minor: optional field with default values and no permission change.
- Major: onboarding progress scale, application status, saved resume shape, or profile vector semantics change.
- On any version bump, notify: onboarding, resume-generation, auto-apply, dashboard.
