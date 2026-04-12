# Inputs Template

<!-- GUIDANCE: Defines every data field a feature collects from the user. This is the contract between UI and backend — what's collected, how it's validated, and where it's stored. -->

## Format

For each input field:

```
### {Field Name}

- **Type:** text | number | select | multiselect | file | toggle | date
- **Required:** yes | no
- **Default:** {value or "none"}
- **Validation:** {rules — min/max length, regex, allowed values}
- **Error message:** "{what to show when validation fails}"
- **Stored as:** {SessionData.fieldName or equivalent}
- **Consumed by:** {which features/steps read this field}
```

## Example

### Job Title

- **Type:** text
- **Required:** yes
- **Default:** parsed from resume (if available)
- **Validation:** 2-100 characters, no special characters except hyphens and periods
- **Error message:** "Please enter a job title (2-100 characters)"
- **Stored as:** SessionData.personal.jobTitle
- **Consumed by:** resume generation, LinkedIn profile, job search queries
