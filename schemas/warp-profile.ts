/**
 * Warp Profile — Cross-product test identity schema
 *
 * A Warp Profile is a product-agnostic identity + product-specific extensions.
 * Profiles created in any Warp product can be loaded in any other.
 *
 * Products add their own extension interface (e.g., consumer productExtension)
 * and register it on the WarpProfile type.
 */

// ── Shared Identity (all products) ──────────────────────────

export interface WarpIdentity {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  workAuth: string;
  education: string;
  languages: string;
}

// ── Profile Metadata ────────────────────────────────────────

export interface WarpProfileMeta {
  profileName: string;
  description: string;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  createdBy: string;   // product ID that created it
  tags: string[];
}

// ── Product Extensions ──────────────────────────────────────
// Each product defines its own extension interface.
// Add new products here as they're built.

export interface consumer productExtension {
  targetStep: number;
  preferences: {
    locationType: string;
    employmentTypes: string[];
    compStructure: string;
    direction: string;
    dealBreakers: string[];
  };
  profile: {
    discipline: string;
    seniority: string;
    domains: string[];
  };
  categories: string[];
}

// ── Warp Profile ────────────────────────────────────────────

export interface WarpProfile {
  meta: WarpProfileMeta;
  warp: WarpIdentity;
  consumer-product?: consumer productExtension;
  // Future product extensions:
  // pixelmon?: PixelMonExtension;
  // specfirst?: SpecFirstExtension;
}
