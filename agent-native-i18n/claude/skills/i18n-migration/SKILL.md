---
name: i18n-migration
description: >
  Structured i18n workflow for React/Next.js projects. Use when adding locales,
  fixing translations, migrating hardcoded strings, or validating i18n setup.
  Runs deterministic CLI tools before and after edits to ensure consistency.
triggers:
  - add.*language
  - add.*locale
  - add.*translation
  - add.*Turkish
  - add.*German
  - add.*French
  - add.*Spanish
  - add.*Japanese
  - add.*Chinese
  - add.*Korean
  - add.*Arabic
  - add.*i18n
  - internationali
  - locali[sz]
  - translation
  - i18n
  - missing.*keys
  - fix.*translation
  - migrate.*strings
  - hardcoded.*strings
  - validate.*i18n
  - preserve.*i18n
---

# i18n Migration Skill

You are helping the user manage internationalization (i18n) in a React or Next.js project using the `i18n-agent` deterministic CLI. Follow this workflow for all i18n tasks.

## Core Principles

1. **Inspect before editing.** Always run detection/analysis before making changes.
2. **Preserve existing conventions.** Match the project's naming, file structure, and locale patterns.
3. **Never rewrite all translation files.** Make minimal, targeted changes.
4. **Prefer stubs over hallucinated translations.** Use TODO placeholders unless the user explicitly asks for translated text.
5. **Validate after changes.** Run validation to catch issues before committing.
6. **Keep diffs minimal.** Only touch the files that need to change.
7. **No direct LLM API calls.** You are the LLM — fill translations by editing files directly.

## Setup

Build the CLI if not already built:

```bash
cd agent-native-i18n/cli
npm install
npm run build
```

## Workflow: Adding a New Locale

When the user asks to add a new language (e.g., "Add Turkish support"):

### Step 1: Detect the project

```bash
node agent-native-i18n/cli/dist/index.js detect --root . --json
```

Review the output to understand:
- Which i18n framework is installed
- Where locale files are stored
- What the base locale is

### Step 2: Analyze current state

```bash
node agent-native-i18n/cli/dist/index.js analyze --root .
```

Review existing locales and key coverage.

### Step 3: Create stub files

```bash
node agent-native-i18n/cli/dist/index.js add-locale tr --root . --mode stub
```

This creates locale files with the same key structure as the base locale, using `TODO [tr]: <original text>` placeholders.

### Step 4: Fill translations (if asked)

If the user wants real translations (not just stubs), open the stub file and replace TODO placeholders with proper translations. Follow these rules:

- Preserve all `{variable}` placeholders exactly as-is
- Preserve ICU plural/select syntax structure
- Keep the same JSON key structure
- Do not add or remove keys
- Do not change the base locale file
- Translate naturally for the target locale
- Keep UI text concise

### Step 5: Validate

```bash
node agent-native-i18n/cli/dist/index.js validate --root .
```

Fix any issues found (missing keys, placeholder mismatches, etc.).

### Step 6: Explain changes

Tell the user:
- Which files were created or modified
- How many keys were added
- Whether validation passed
- What they should review

## Workflow: Fixing Broken Translations

When the user reports broken or missing translations:

1. Run `analyze --root . --json` to get the full coverage report
2. Identify missing keys and placeholder mismatches
3. Fix only the specific issues — do not rewrite entire files
4. Run `validate --root .` to verify the fix

## Workflow: Validating i18n Setup

When the user asks to validate i18n:

```bash
node agent-native-i18n/cli/dist/index.js validate --root . --ci
```

Report the results. For each issue:
- Explain what the issue means
- Suggest a fix
- Offer to fix it

## Workflow: Migrating Hardcoded Strings

When the user asks to migrate hardcoded UI strings to i18n:

1. Run `detect` to understand the framework
2. Identify hardcoded strings in the specified files
3. For each string:
   - Determine the appropriate namespace and key name following the project's conventions
   - Add the key to the base locale file
   - Replace the hardcoded string with the appropriate i18n call:
     - **next-intl (client)**: `const t = useTranslations("namespace"); ... t("keyName")`
     - **next-intl (server)**: `const t = await getTranslations("namespace"); ... t("keyName")`
     - **react-i18next**: `const { t } = useTranslation("namespace"); ... t("keyName")`
   - Add the import if missing
4. Run `validate` to check consistency
5. Create stub entries in all target locales for the new keys

## Workflow: Preserving Existing i18n Setup

When the user says "preserve the existing i18n setup" or similar:

1. Run `detect` and `analyze` to understand the current state
2. Do NOT change:
   - The i18n library or framework
   - The locale file structure or naming pattern
   - The namespace strategy
   - Existing translations
   - The base locale
3. Only make additive changes (new keys, new locales)

## Key Naming Conventions

Follow the project's existing conventions. If none exist, use:

- **Namespaces**: Derived from route path (`app/settings/page.tsx` → `settings`)
- **Keys**: camelCase, descriptive, purpose-focused
  - Buttons: `submitForm`, `cancelEdit`, `saveChanges`
  - Labels: `emailLabel`, `passwordLabel`
  - Messages: `successMessage`, `errorNotFound`
  - Headings: `welcomeTitle`, `pageHeading`

## Safety Rules

- Never translate comparison operands, localStorage keys, API endpoints, route paths, CSS class names, or technical identifiers
- Never remove existing translations
- Never change the base locale's values unless explicitly asked
- Always check for `{variable}` placeholders and preserve them in translations
- If unsure whether a string should be translated, leave it as-is and flag it for the user

## Example Commands

```bash
# Full project analysis
node agent-native-i18n/cli/dist/index.js detect --root /path/to/project --json
node agent-native-i18n/cli/dist/index.js analyze --root /path/to/project

# Add Turkish locale with stubs
node agent-native-i18n/cli/dist/index.js add-locale tr --root /path/to/project --mode stub

# Validate all locale files
node agent-native-i18n/cli/dist/index.js validate --root /path/to/project --ci

# JSON output for programmatic use
node agent-native-i18n/cli/dist/index.js analyze --root /path/to/project --json
```
