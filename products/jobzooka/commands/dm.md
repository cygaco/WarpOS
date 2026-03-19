---
name: dm
description: Audit Deus Mechanicus — verify manifest, modules, and DM shell integrity
---

Audit the Deus Mechanicus dev tools system. Check that:

1. **Manifest integrity** — verify `deus-mechanicus-consumer-product.ts` manifest matches current app state:
   - Steps match `PHASE_DISPLAY` in `constants.ts`
   - Fields cover all `SessionData` keys in `types.ts`
   - Test suites reference valid endpoints
2. **Module registry** — all modules in `DeusMechanicus.tsx` MODULES array have valid components in `src/components/dm-modules/`
3. **Context wiring** — `DMContext` provider wraps the app tree in `page.tsx`
4. **Build check** — run `npm run build` and report any DM-related errors
5. **Visual check** — load `/?deusmechanicus` and screenshot the DM panel open with each tab

Report a summary table:
| Check | Status | Notes |
|-------|--------|-------|

If the user says `/dm fix`, also fix any issues found.
If the user says `/dm sync`, update the manifest to match current code state.
