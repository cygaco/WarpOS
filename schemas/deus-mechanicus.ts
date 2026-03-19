/**
 * Deus Mechanicus — Product-agnostic dev tools manifest
 *
 * Any Warp product exports a ProductManifest so Deus Mechanicus can:
 * - Generate fast-forward buttons from steps
 * - Build / inject test sessions via buildSession + setState
 * - Run QA suites via testSuites
 * - Inspect live state via getState
 *
 * Implementation: each product creates its own manifest factory
 * (see consumer-product's deus-mechanicus-consumer-product.ts as reference).
 * The DM shell component reads the manifest to generate UI.
 */

// ── Product Manifest ────────────────────────────────────────

export interface ProductStep {
  number: number;
  label: string;       // short label for DP bar buttons ("1", "R1", "A3", "F")
  name: string;        // human label ("Resume Upload", "Market Analysis")
  phase?: string;      // grouping ("onboarding", "ready", "aim", "fire")
}

export interface ProductField {
  key: string;         // field on session object (e.g. "marketAnalysis")
  label: string;       // human-readable
  type: 'string' | 'object' | 'array' | 'boolean' | 'number';
  step: number;        // which step produces this field
  required?: boolean;  // is it needed for downstream steps
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface TestSuiteResult {
  results: TestResult[];
}

export interface ProductTestSuite {
  name: string;
  description: string;
  runner: () => Promise<TestSuiteResult>;
}

export interface ProductManifest {
  id: string;
  name: string;
  version: string;
  steps: ProductStep[];
  fields: ProductField[];
  testSuites: ProductTestSuite[];
  buildSession: (step: number) => Record<string, unknown>;
  getState: () => Record<string, unknown> | null;
  setState: (data: Record<string, unknown>, step: number) => void;
}

// ── Module Registration ─────────────────────────────────────

export interface DMModuleProps {
  manifest: ProductManifest;
  isActive: boolean;
}

export interface DMModule {
  id: string;
  name: string;
  icon: string;        // icon identifier
  description: string;
  badge?: () => number | null;
  component: unknown;  // ComponentType<DMModuleProps> — product provides the React type
}

// ── DM Context ──────────────────────────────────────────────

export interface DMContextValue {
  active: boolean;            // is DM loaded
  panelOpen: boolean;         // is the panel visible
  activeModule: string;       // which tab is showing
  modules: DMModule[];        // registered modules
  manifest: ProductManifest | null;

  openPanel: () => void;
  closePanel: () => void;
  setModule: (id: string) => void;
  fastForward: (step: number) => void;
  runTests: () => void;
}
