---
name: security-log
description: Log a security gotcha, incident, decision, or boundary to the Notion Security KB
---

Log an entry to the Warp Security KB in Notion.

## Usage

- `/security-log` — interactive (asks questions)
- `/security-log gotcha <title>` — shortcut with type and title pre-filled

## Steps

### 1. Collect Entry Details

Ask the user the following questions **one at a time**, waiting for each answer before proceeding. If any values were provided as arguments, skip those questions.

**Question 1 — Type:**
> What type of entry is this?
> 1. **Gotcha** — a non-obvious footgun or surprising behavior
> 2. **Decision** — a deliberate security tradeoff we made
> 3. **Incident** — a bug, breach, or near-miss that happened
> 4. **Boundary** — a security boundary or constraint we enforce

**Question 2 — Title:**
> Short title for this entry? (e.g., "localStorage not encrypted on Safari private mode")

**Question 3 — What Happened:**
> What happened? Describe the situation in 2-4 sentences.

**Question 4 — Product:**
> Which product does this apply to?
> Options: All, consumer product, Keyword Intelligence, Walker, PixelMon, SpecFirst
> (Default: consumer product)

**Question 5 — Severity:**
> Severity?
> 1. **Critical** — active exploit or data exposure
> 2. **High** — serious risk, needs immediate fix
> 3. **Medium** — real risk, can be scheduled (default)
> 4. **Low** — minor concern, good to document
> 5. **Info** — FYI for future reference

### 2. Auto-Generate Fields

Based on the user's answers, generate these fields yourself — do NOT ask the user:

- **Lesson**: A concise, actionable takeaway. What should we do differently? Write it as an imperative sentence (e.g., "Always validate X before Y" or "Never assume Z").
- **Revisit When**: A concrete trigger for when this should be re-evaluated (e.g., "When migrating to server-side sessions", "Next security audit", "When Safari fixes private browsing storage").

### 3. Confirm Before Logging

Show the user a summary of what will be logged:

```
Entry:        [title]
Type:         [type]
Product:      [product]
Severity:     [severity]
What Happened: [what happened]
Lesson:       [auto-generated]
Revisit When: [auto-generated]
Status:       Active
Date:         [today's date]
```

Ask: **"Log this to the Security KB?"** — wait for confirmation.

### 4. Create the Notion Entry

Use the `mcp__67ee050f-5e88-4ba8-acba-8f3147e3aa7e__notion-create-pages` tool with:

```json
{
  "parent": {
    "data_source_id": "8aaf4081-2faa-479b-a7ed-12cdaf4f5cae"
  },
  "pages": [
    {
      "properties": {
        "Entry": "[title]",
        "Type": "[type]",
        "Product": "[product]",
        "What Happened": "[what happened]",
        "Lesson": "[lesson]",
        "Revisit When": "[revisit when]",
        "Severity": "[severity]",
        "Status": "Active",
        "date:Date:start": "[YYYY-MM-DD]",
        "date:Date:is_datetime": 0
      }
    }
  ]
}
```

### 5. Confirm

After successful creation, report:

> Logged to Security KB: **[title]** ([type] / [severity])

## Rules

- Default product to **consumer product** if user just hits enter or says "this project"
- Default severity to **Medium** if user just hits enter
- Default status is always **Active**
- Date is always today's date
- Keep Lesson under 2 sentences — actionable, not narrative
- Keep Revisit When under 1 sentence — a concrete trigger, not "someday"
- Never log without user confirmation
