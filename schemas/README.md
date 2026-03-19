# Schemas

Canonical TypeScript interfaces shared across all Warp products.

## Files

| Schema | Purpose | First Implementation |
|--------|---------|---------------------|
| `warp-profile.ts` | Cross-product test identity (shared identity + product extensions) | consumer product |
| `deus-mechanicus.ts` | Dev tools manifest (steps, fields, test suites, state accessors) | consumer product |

## How Products Use These

Products copy or reference these interfaces. The canonical version lives here in WarpOS. When a product needs to add a new extension (e.g., a new product's test data shape), the extension interface is added here first, then implemented in the product.

## Rules

- Interfaces only — no implementations, no runtime code
- Changes here should be backwards-compatible (add fields as optional)
- Every interface gets a doc comment explaining its purpose
