---
name: skill:edit
description: Edit an existing skill
---

# /skill:edit — Edit a Skill

## Usage

```
/skill:edit <name>
/skill:edit <name> "<what to change>"
```

## Procedure

### Step 1: Find the skill

Look for `.claude/commands/<name>.md`. If it doesn't exist, list available skills and ask which one to edit.

### Step 2: Read current content

Read the skill file and display its current structure:
- Name and description
- Number of steps
- Subcommands (if any)

### Step 3: Impact check

Before editing, grep for references to this skill across the system:

1. **Other skills**: `grep -r "/namespace:name" .claude/commands/` — which skills call or reference this one?
2. **CLAUDE.md**: Does the system prompt reference this skill by name?
3. **Hook scripts**: `grep -r "namespace:name\|namespace/name" scripts/hooks/` — any hooks reference it?
4. **Systems manifest**: `grep "namespace/name\|namespace:name" .claude/memory/systems.jsonl`
5. **Reference docs**: `grep -r "namespace:name" .claude/reference/`

Report what connects to this skill before making changes. If the edit changes the skill's name, interface, or output format, flag the connected files that may need updating.

### Step 4: Apply changes

If the user specified what to change, apply it. Otherwise ask: "What would you like to change?"

Common edits:
- Add/remove/reorder steps
- Change the description
- Add a subcommand
- Fix file path references
- Make steps more specific

### Step 5: Update references

If the edit changed the skill name or moved it:
- Update all files found in Step 3 that reference the old name
- Update systems.jsonl if the skill is listed in a system's `files` array

### Step 6: Verify

Read the file back. Confirm frontmatter is intact and steps are numbered.

Report: "Updated `/name` — <summary of changes>. [N] references updated."
