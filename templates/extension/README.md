# Chrome Extension Template — Manifest V3

Template for Chrome extensions that bridge a Warp web app with external sites (e.g., LinkedIn).

## Architecture

```
Web App  ←→  Background (service worker)  ←→  Content Script (target site)
         external message                 internal message
```

- **Web app** sends commands via `chrome.runtime.sendMessage` (externally connectable)
- **Background** routes messages, manages state, handles tab lifecycle
- **Content script** interacts with the target site DOM

## manifest.json template

```json
{
  "manifest_version": 3,
  "name": "Product Launcher",
  "version": "0.1.0",
  "description": "Bridges [product] with [target site]",
  "permissions": ["activeTab", "storage", "tabs", "scripting"],
  "host_permissions": ["https://www.target-site.com/*"],
  "background": { "service_worker": "background.js" },
  "content_scripts": [
    {
      "matches": ["https://www.target-site.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": { "default_popup": "popup.html" },
  "externally_connectable": {
    "matches": ["https://your-app.com/*", "http://localhost:3000/*"]
  }
}
```

## Message protocol

### Web app → Background (external)

```typescript
// From web app
chrome.runtime.sendMessage(EXTENSION_ID, {
  type: "start_apply" | "get_status" | "pause" | "resume" | "stop" | "ping",
  payload: {
    /* session data, queries, profile */
  },
});
```

### Background → Content script (internal)

```typescript
// From background to content script
chrome.tabs.sendMessage(tabId, {
  type: "start_apply_internal" | "pause" | "resume" | "stop",
  payload: {
    /* session, queries */
  },
});
```

### Content script → Background (internal)

```typescript
// From content script to background
chrome.runtime.sendMessage({
  type: "status_update" | "job_result" | "next_query" | "next_page",
  payload: {
    /* status, results */
  },
});
```

## Key patterns

### Tab management

```javascript
async function findOrCreateTab(url) {
  const tabs = await chrome.tabs.query({ url: url + "*" });
  if (tabs.length > 0) return tabs[0];
  return chrome.tabs.create({ url, active: true });
}
```

### State relay back to web app

```javascript
function relayToWebApp(tabId, message) {
  chrome.tabs.sendMessage(tabId, message);
}
```

### Human-in-the-loop

Never auto-submit without user review. Content script should pause before final submission and wait for explicit user approval.

## First implementation

consumer product: `extension/` — LinkedIn Easy Apply automation
