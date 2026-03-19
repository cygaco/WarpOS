# Bright Data Integration Pattern

Async scraping via Bright Data's Dataset API: POST trigger → poll progress → GET results.

## Flow

```
Client POST (queries) → API route → BD trigger (snapshot_id)
                                  → Poll loop (snapshot_id → progress%)
                                  → BD GET results (normalized)
                         ← Return normalized results
```

## Setup

```env
BRIGHTDATA_API_KEY=         # From BD console
BRIGHTDATA_DATASET_ID=      # Dataset ID (e.g., gd_lpfll7v5hcqtkxl6l)
DAILY_JOB_REQUEST_LIMIT=100 # Budget cap
```

## Implementation

### Trigger a scrape

```typescript
const response = await fetch(
  `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&discover_by=keyword&limit_per_input=25`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(inputs), // Array of search inputs
  },
);
const { snapshot_id } = await response.json();
```

### Search inputs format

```typescript
const inputs = queries.map((q) => ({
  keyword: q.keyword,
  location: q.location,
  country: "US",
  job_type: q.jobType, // "Full-time", "Contract", etc. (case-sensitive)
  remote: q.remote, // "Remote" (capital R) or omit
  time_range: "Past week",
}));
```

### Poll for completion

```typescript
async function pollProgress(snapshotId: string): Promise<string> {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `https://api.brightdata.com/datasets/v3/progress/${snapshotId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    const data = await res.json();
    if (data.status === "ready") return "ready";
    if (data.status === "failed") throw new Error("Scrape failed");
    await new Promise((r) => setTimeout(r, 10_000)); // 10s between polls
  }
  throw new Error("Timeout");
}
```

### Fetch results

```typescript
const res = await fetch(
  `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
  { headers: { Authorization: `Bearer ${apiKey}` } },
);
const results = await res.json();
```

### Normalize results

BD field names vary between datasets. Always normalize:

```typescript
function normalize(job: Record<string, unknown>) {
  return {
    title: job.title || job.job_title || "",
    company: job.company || job.company_name || job.organization || "",
    location: job.location || job.job_location || "",
    salary: job.salary || job.job_salary || "",
    url: job.url || job.job_url || job.link || "",
    description: job.description || job.job_description || "",
    easyApply: Boolean(job.easy_apply || job.easyApply),
    postedDate: job.date_posted || job.posted_date || "",
  };
}
```

### Deduplicate

```typescript
function deduplicate(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${j.title}|${j.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

## Known gotchas

- **Case-sensitive enums**: `job_type` must be exactly `"Full-time"`, `"Contract"`, etc.
- **Remote must be capitalized**: `"Remote"` not `"remote"`
- **Annual vs hourly**: BD returns annual salaries even for contract roles — extract hourly from description text via regex
- **Thin data for non-FT**: Part-time, Temporary, Volunteer yield few results
- **Rate limits**: BD has its own rate limits — budget cap prevents runaway costs

## Daily budget

See [rate-limiting.md](./rate-limiting.md) for the budget tracking pattern. Jobs API uses a simpler single-counter variant:

```typescript
const DAILY_BUDGET = parseInt(process.env.DAILY_JOB_REQUEST_LIMIT || "100", 10);

async function checkJobBudget(): Promise<boolean> {
  if (!redis) return true;
  const key = `budget:jobs:${new Date().toISOString().slice(0, 10)}`;
  const count = parseInt(((await redis.get(key)) as string) || "0", 10);
  return count < DAILY_BUDGET;
}
```

## First implementation

consumer product: `src/app/api/jobs/route.ts`
