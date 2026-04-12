# Inputs: Onboarding Wizard

## Step 1: Data Import

### File Upload

- **Type:** file
- **Required:** yes (either file or text paste)
- **Validation:** PDF, DOCX, or TXT; max 10MB; non-empty
- **Error message:** "Please upload a PDF, Word, or text file (max 10MB)"
- **Stored as:** SessionData.rawInput
- **Consumed by:** AI parsing (Step 1), profile generation (Step 3)

### Text Paste

- **Type:** text (textarea)
- **Required:** yes (if no file uploaded)
- **Validation:** min 50 characters, max 50,000 characters
- **Error message:** "Please paste at least 50 characters"
- **Stored as:** SessionData.rawInput
- **Consumed by:** AI parsing (Step 1), profile generation (Step 3)

## Step 2: Preferences

### Goal / Direction

- **Type:** select
- **Required:** yes
- **Options:** <!-- Define based on your product domain -->
- **Stored as:** SessionData.preferences.direction
- **Consumed by:** profile generation, downstream features

### Category / Type

- **Type:** multiselect
- **Required:** yes (at least 1)
- **Options:** <!-- Define based on your product domain -->
- **Stored as:** SessionData.preferences.categories
- **Consumed by:** search, recommendations

### Location

- **Type:** text (with autocomplete)
- **Required:** no
- **Default:** "Remote"
- **Stored as:** SessionData.preferences.location
- **Consumed by:** search filters

### Additional Preferences

<!-- GUIDANCE: Add more preference fields as needed. Follow the same format for each. -->
