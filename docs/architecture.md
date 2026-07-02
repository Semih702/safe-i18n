# Architecture

## Design Principles

1. **LLM never touches source code.** The LLM suggests translations, descriptions, and key names. All source code modifications are performed by deterministic AST-based codemods.

2. **Conservative by default.** Uncertain code is skipped with an explanation, not silently modified. A skipped migration with a clear reason is better than a broken component.

3. **Reviewable and reversible.** Every change is tracked in a manifest. Every transformation is explainable. Rollback is always possible without relying on Git.

4. **Separation of concerns.** Scanning, planning, applying, translating, and validating are separate steps. Each can be run independently.

## Module Structure

```
src/
  cli/           CLI commands (commander-based)
  core/          Core logic (scanner, planner, config, risk classifier, manifest)
  adapters/      i18n framework adapters (next-intl)
  codemod/       AST parsing, transforms, safety checks
  llm/           LLM provider system (mock, openai-compatible)
  validators/    Locale file and project validation
  utils/         File system, git, logging, path utilities
```

## Data Flow

```
scan → StringCandidate[] → plan → MigrationPlan → apply → ApplyManifest
                                                      ↓
                                                  translate → LocaleFile[]
                                                      ↓
                                                  validate → ValidationResult
```

## Risk Classification Pipeline

The scanner extracts string candidates from AST nodes. Each candidate passes through the risk classifier which checks, in priority order:

1. **SKIP_NON_UI** — console calls, test IDs, classNames, imports, routes, enums, analytics
2. **SKIP_DANGEROUS** — comparisons, storage calls, API calls, URLs, identifiers
3. **REVIEW_REQUIRED** — conditionals, template literals (checked before AUTO_SAFE)
4. **AUTO_SAFE** — visible element text, safe props (placeholder, aria-label, alt, title)

The key design decision is that REVIEW_REQUIRED checks run before AUTO_SAFE. A string inside a conditional expression is always REVIEW_REQUIRED, even if it's inside a `<button>`. Uncertainty outranks safe context.

## AST Strategy

We use `@babel/parser` + `@babel/traverse` for scanning and `@babel/generator` for code generation. This was chosen over ts-morph because:

- Babel handles JSX/TSX natively with full location tracking
- Babel traverse provides clean visitor patterns for JSX-specific nodes
- `retainLines: true` in the generator preserves line positions for minimal diffs

## Safety Checks

Before transforming any entry, the safety module verifies:

- Entry action is "apply" (not "review" or "skip")
- Risk level is AUTO_SAFE
- No server component + hook conflict
- No template literal transforms (always require manual review)
- File component type supports hooks (if using useTranslations)

If any check fails, the entry is skipped with a reason.

## LLM Provider Architecture

The provider system is intentionally minimal:

```
TranslationProvider (interface)
  ├── MockProvider (deterministic, for testing)
  └── OpenAICompatibleProvider (any OpenAI-compatible API)
```

Providers receive only the extracted string, semantic metadata, and bounded context — never entire source files. API keys come from environment variables referenced by name in config.
