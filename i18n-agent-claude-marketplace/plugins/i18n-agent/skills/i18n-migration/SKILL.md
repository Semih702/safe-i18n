---
description: Use this skill when adding a new language, adding Turkish support, fixing translations, validating i18n keys, migrating hardcoded UI strings, or preserving an existing i18n setup in JavaScript or TypeScript projects. Prefer this workflow before editing locale files directly.
---

# i18n Migration Skill

You are helping the user manage internationalization (i18n) in a JavaScript or TypeScript project. Use the `i18n-agent` CLI (available on your PATH via the plugin) for deterministic analysis and validation. You provide the intelligence: reading results, editing files, making translation decisions.

## Workflow

For every i18n task, follow this cycle:

### 1. Understand the goal

Read the user's request. Common goals:
- Add a new language/locale
- Fix broken or missing translations
- Validate existing locale files
- Migrate hardcoded UI strings to i18n
- Preserve the current i18n setup while making changes

### 2. Detect project setup

```bash
i18n-agent detect
```

This tells you the framework, i18n library, locale file locations, and base locale. Use `--json` if you need structured data for decision-making.

### 3. Analyze current state

```bash
i18n-agent analyze
```

This shows locale coverage, missing keys, and extra keys. Review before making changes.

### 4. Make changes

Follow these rules:
- **Preserve existing conventions.** Match naming, structure, and patterns.
- **Never rewrite all translation files.** Make targeted, minimal changes.
- **Prefer stubs over hallucinated translations.** Use `TODO [locale]: original text` placeholders unless the user explicitly requests real translations.
- **Keep diffs minimal.** Only touch files that need to change.

For adding a new locale:
```bash
i18n-agent add-locale tr --mode stub
```

For translating stubs the user wants filled in:
- Open the stub file
- Replace `TODO [tr]: ...` placeholders with real translations
- Preserve all `{variable}` placeholders exactly as-is
- Preserve ICU plural/select syntax structure
- Do not add or remove keys
- Do not change the base locale file

For migrating hardcoded strings:
- Identify translatable strings in the specified files
- Choose namespace/key names following the project's existing conventions
- Add keys to the base locale file
- Replace hardcoded strings with the appropriate i18n call:
  - **next-intl (client)**: `const t = useTranslations("ns"); t("key")`
  - **next-intl (server)**: `const t = await getTranslations("ns"); t("key")`
  - **react-i18next**: `const { t } = useTranslation("ns"); t("key")`
  - **vue-i18n**: `$t("key")` in templates, `t("key")` in composition API
  - **i18next**: `i18next.t("ns:key")`
- Add missing imports
- Create stub entries in all target locale files for new keys

### 5. Validate

```bash
i18n-agent validate
```

Fix any issues found. If validation fails, fix only the failing keys — do not rewrite entire files.

### 6. Summarize

Tell the user:
- Which files were created or modified
- How many keys were added/changed
- Whether validation passed
- Any manual follow-up needed

## Key Naming Conventions

Follow the project's existing conventions. If none exist:
- **Namespaces**: Derived from route path (`app/settings/page.tsx` -> `settings`)
- **Keys**: camelCase, purpose-focused
  - Buttons: `submitForm`, `cancelEdit`
  - Labels: `emailLabel`, `passwordLabel`
  - Messages: `successMessage`, `errorNotFound`
  - Headings: `welcomeTitle`, `pageHeading`

## Example User Requests

These are the kinds of requests that should activate this skill:

- "Add Turkish language support to this repo."
- "Add a new locale for German."
- "Fix broken i18n keys."
- "Validate our translations."
- "Migrate this component's hardcoded strings to i18n."
- "Preserve the existing next-intl setup while adding tr."
- "Check for missing translation keys."
- "Add French and Spanish locales."

## Do Not

- Do not call external LLM APIs (OpenAI, Anthropic, DeepL, Google Translate).
- Do not rewrite every locale file when fixing one issue.
- Do not rename existing keys unless the user explicitly asks.
- Do not change i18n framework configuration unless the analysis shows it is required.
- Do not translate legal, medical, security, or customer-facing production text without explicit user approval.
- Do not remove existing translations.
- Do not change the base locale's values unless explicitly asked.
- Do not invent `{variable}` placeholders that don't exist in the source.

## Checking Plugin Health

If something seems wrong, run:
```bash
i18n-agent doctor
```

For more details on framework-specific behavior, see `reference.md` in this skill directory.
