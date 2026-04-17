# Encrypted Client Storage Pattern — AES-GCM

Zero-server-persistence storage using Web Crypto API. Data encrypted at rest in localStorage, key derived from device fingerprint. No server needed for MVP.

## How it works

1. Device fingerprint → PBKDF2 → AES-256 key
2. Data → JSON → AES-GCM encrypt → base64(iv) + '.' + base64(ciphertext) → localStorage
3. Read → decrypt → validate → parse

## Setup

No dependencies — uses native Web Crypto API (`crypto.subtle`).

## Implementation

### Key derivation

```typescript
async function deriveCryptoKey(): Promise<CryptoKey> {
  // Device fingerprint (stable across sessions, unique per device)
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(fingerprint),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("your-app-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
```

### Encrypt / Decrypt

```typescript
async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data),
  );
  const ivB64 = btoa(String.fromCharCode(...iv));
  const dataB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  return ivB64 + "." + dataB64;
}

async function decrypt(packed: string, key: CryptoKey): Promise<string> {
  const [ivB64, dataB64] = packed.split(".");
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const data = Uint8Array.from(atob(dataB64), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return new TextDecoder().decode(decrypted);
}
```

### Save / Load session

```typescript
async function saveSession(session: SessionData): Promise<void> {
  const key = await deriveCryptoKey();
  const json = JSON.stringify(session);
  const encrypted = await encrypt(json, key);
  localStorage.setItem("session", encrypted);
}

async function loadSession(): Promise<SessionData | null> {
  const encrypted = localStorage.getItem("session");
  if (!encrypted) return null;
  try {
    const key = await deriveCryptoKey();
    const json = await decrypt(encrypted, key);
    const data = JSON.parse(json);
    return validate(data) ? data : null;
  } catch {
    return null; // Corrupted or tampered
  }
}
```

### Validation guard

```typescript
function validate(data: unknown): data is SessionData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  // Size check — reject suspiciously large payloads
  if (JSON.stringify(d).length > 500_000) return false;
  // Type checks on critical fields
  if (typeof d.step !== "number" || d.step < 0 || d.step > 20) return false;
  return true;
}
```

## Schema migration

```typescript
function migrate(data: SessionData): SessionData {
  if (data.version === 1) {
    // v1 → v2: rename fields, adjust step numbers
    data = { ...data, version: 2 /* transformations */ };
  }
  if (data.version === 2) {
    // v2 → v3: add new fields with defaults
    data = { ...data, version: 3, newField: defaultValue };
  }
  return data;
}
```

## Key design decisions

- **Device fingerprint, not random key**: Key is deterministic per device — survives tab close, page refresh. No "forgot password" problem.
- **PBKDF2 with 100k iterations**: Slow enough to resist brute force, fast enough to not lag UI
- **Random IV per encrypt**: Same plaintext produces different ciphertext each time
- **Validation on decrypt**: Rejects corrupted/tampered data before it reaches the app
- **No server dependency**: Perfect for MVP — add server sync later without changing the encryption layer

## Limitations

- Data lost if user clears localStorage or switches devices
- Device fingerprint can change (OS update, screen resolution change) — rare but possible
- Not suitable for sensitive credentials (use server-side for those)

## First implementation

Example project: `src/lib/storage.ts`
