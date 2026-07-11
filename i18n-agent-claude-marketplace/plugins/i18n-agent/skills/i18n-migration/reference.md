# i18n Migration Reference

Extended guidance for framework-specific behavior, interpolation rules, and migration safety.

## Framework-Specific Notes

### next-intl

- Uses `useTranslations(namespace)` in client components and `getTranslations(namespace)` in server components (async).
- Message files are typically flat JSON in `messages/en.json`, `messages/tr.json`.
- Namespaces are top-level keys in the JSON file.
- Server components (files in `app/` without `"use client"`) must use `getTranslations`.
- Middleware at `middleware.ts` handles locale routing.
- Config at `i18n/request.ts` or `src/i18n/request.ts` defines supported locales.
- Rich text uses `<bold>text</bold>` syntax, not HTML tags.

### react-i18next

- Uses `useTranslation(namespace)` hook; returns `{ t, i18n }`.
- Supports namespaced files: `locales/en/common.json`, `locales/en/auth.json`.
- Also supports flat files: `locales/en.json`.
- Backend loading via `i18next-http-backend` or `i18next-fs-backend`.
- Interpolation uses `{{name}}` (double braces) by default, not `{name}`.
- Plural keys: `key_one`, `key_other` (or `key_0`, `key_1`, `key_2` for counted).
- Trans component for inline markup: `<Trans i18nKey="key">Hello <bold>world</bold></Trans>`.

### i18next (standalone)

- Same interpolation as react-i18next: `{{name}}`.
- Can be used server-side or in non-React frameworks.
- `i18next.t("namespace:key")` for namespaced access.
- Supports nested keys: `i18next.t("auth.login.title")`.

### vue-i18n

- Template syntax: `{{ $t("key") }}` or `v-t="'key'"` directive.
- Composition API: `const { t } = useI18n()`.
- Options API: `this.$t("key")`.
- Interpolation uses `{name}` (single braces).
- Plural: `{count} item | {count} items` pipe syntax, or ICU `{count, plural, ...}`.
- Locale files typically in `src/locales/en.json` or `locales/en.json`.
- Nuxt i18n module (`@nuxtjs/i18n`) adds auto-routing and lazy loading.
- Component-level translations via `<i18n>` custom block in SFC files.

## Placeholder and Interpolation Rules

### Preservation Rules

When translating or creating locale entries:

1. **Never change placeholder names.** If the source has `{userName}`, the translation must have `{userName}`.
2. **Never add new placeholders.** If the source has no variables, the translation must have no variables.
3. **Never remove placeholders.** Every placeholder in the source must appear in the translation.
4. **Preserve placeholder casing.** `{firstName}` must not become `{firstname}`.

### Framework-Specific Interpolation

| Framework | Variable | Plural | Rich Text |
|-----------|----------|--------|-----------|
| next-intl | `{name}` | ICU `{count, plural, ...}` | `<bold>text</bold>` |
| react-i18next | `{{name}}` | `key_one` / `key_other` | `<1>text</1>` or `<bold>text</bold>` |
| i18next | `{{name}}` | `key_one` / `key_other` | Component interpolation |
| vue-i18n | `{name}` | Pipe syntax or ICU | `{'@:key'}` linked messages |

### ICU Syntax

For frameworks using ICU message syntax:

```
{count, plural,
  =0 {No items}
  one {{count} item}
  other {{count} items}
}
```

Rules:
- `other` case is always required for plural
- At least one case is required for select
- Braces must be balanced (every `{` has a matching `}`)
- Escape literal braces with `'{'` in ICU

## Pluralization Concerns

Different languages have different plural forms:
- English: `one`, `other`
- Arabic: `zero`, `one`, `two`, `few`, `many`, `other`
- Polish: `one`, `few`, `many`, `other`
- Japanese/Chinese/Korean: `other` only

When creating stubs for languages with complex plural rules, include TODO comments noting that plural forms may need expansion.

## Safe Migration Rules

### Strings That Should Be Translated

- Static text inside UI elements: headings, paragraphs, buttons, labels, links
- Placeholder attributes: `placeholder`, `aria-label`, `title`, `alt`
- User-facing error messages and success messages
- Menu items, navigation labels, tooltips
- Form validation messages

### Strings That Must NOT Be Translated

- Comparison operands: `if (status === "active")`
- localStorage/sessionStorage keys
- API endpoints, URLs, route paths
- CSS class names, test IDs (`data-testid`)
- Analytics event names
- Import paths and module names
- Enum values and constants
- Brand names (unless a known localized form exists)

### Strings That Need Manual Review

- Strings inside conditional expressions
- Template literals with interpolation
- Strings passed to function calls (could be UI labels or internal identifiers)
- Strings in arrays or objects (could be menu items or config values)

## Review Checklist

Before completing an i18n task:

- [ ] Ran `i18n-agent detect` to understand the project
- [ ] Ran `i18n-agent analyze` to check coverage
- [ ] Preserved existing file structure and naming conventions
- [ ] Did not modify the base locale file unless requested
- [ ] All `{variable}` placeholders preserved in translations
- [ ] No new variables invented in translations
- [ ] Ran `i18n-agent validate` and it passed
- [ ] Did not translate technical identifiers, routes, or comparison operands
- [ ] Did not call any external API
- [ ] Summarized changes to the user
