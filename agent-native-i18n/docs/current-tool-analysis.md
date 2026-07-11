# Current Tool Analysis: safe-i18n

## What the existing tool does

`safe-i18n` (v0.1.0) is an AI-assisted i18n migration CLI for React/Next.js projects. It follows a strict separation between deterministic code transforms and LLM-powered translation:

1. **Scans** source files for hardcoded UI strings using Babel AST parsing
2. **Classifies** each string by risk level (AUTO_SAFE, REVIEW_REQUIRED, SKIP_NON_UI, SKIP_DANGEROUS)
3. **Plans** a migration as a JSON manifest before touching any files
4. **Applies** safe AST-based codemods to replace strings with `useTranslations` / `getTranslations` calls
5. **Translates** extracted strings via an LLM provider (OpenAI-compatible API)
6. **Validates** locale files for missing keys, unused keys, placeholder mismatches, ICU syntax, and duplicates
7. **Rolls back** changes using a saved manifest

### CLI commands

| Command | Purpose |
|---------|---------|
| `init` | Detect project structure, write config |
| `scan` | Find hardcoded strings, classify risk |
| `plan` | Create migration plan JSON |
| `apply` | Execute AST codemods |
| `translate` | Call LLM API for translations |
| `validate` | Check locale file consistency |
| `rollback` | Restore files from manifest |
| `migrate` | All-in-one: init + scan + plan + apply + translate |
| `sync` | Catch up new strings since last migration |
| `add-locale` | Add a new target language |
| `reset` | Clean up manifests and generated files |

## What should remain deterministic (no LLM needed)

These operations are pure logic and should be the core of the agent-native CLI:

- **Project detection**: framework, TypeScript, router type, package manager, existing i18n library (`src/core/project-analyzer.ts`)
- **i18n framework detection**: next-intl install status, config file presence (`src/adapters/next-intl/detect.ts`)
- **Locale file discovery**: reading `messages/*.json`, listing available locales
- **Key analysis**: flattening nested JSON, finding missing/unused keys, comparing key sets across locales
- **Placeholder validation**: extracting `{variables}` and checking parity across locales (`src/validators/placeholder-validator.ts`)
- **ICU syntax validation**: balanced braces, plural/select/selectordinal structure (`src/validators/icu-validator.ts`)
- **Duplicate key detection**: scanning raw JSON for repeated keys at the same depth (`src/validators/locale-validator.ts`)
- **Risk classification**: rule-based heuristics for identifying safe vs. dangerous strings (`src/core/risk-classifier.ts`)
- **AST scanning**: extracting JSX text, attributes, expression containers, template literals (`src/core/scanner.ts`)
- **Stub generation**: copying key structure with empty/TODO values for new locales

## What currently depends on direct LLM API calls

These operations call the OpenAI-compatible API via `src/llm/openai-compatible-provider.ts`:

1. **Translation** (`translate`, `translateBatch`): Sends extracted strings with context to the LLM, receives translated text. Used by the `translate` and `migrate` commands.
2. **Key suggestion** (`suggestKey`): Asks the LLM for namespace/key naming given source text and context. Used during `plan`.
3. **Translatable filtering** (`filterTranslatable`): Asks the LLM to classify whether strings are brand names, technical terms, etc. Used as a pre-filter during scanning.

### LLM provider architecture

- `TranslationProvider` interface in `src/llm/provider.ts` with methods: `translate`, `translateBatch`, `suggestKey`, `filterTranslatable`
- `MockProvider` for testing (returns prefixed strings like `[TR] Hello`)
- `OpenAICompatibleProvider` for real translations (calls `/chat/completions`)
- Factory function `createProvider(config)` selects provider by name
- Prompts in `src/llm/prompts.ts` build structured system/user messages

## What should move to Claude Code instructions/skills

In the agent-native approach, Claude Code itself is the LLM. Instead of the CLI calling an external API:

1. **Translation**: Claude reads the stub file and fills in translations directly, guided by the skill instructions. No API call needed.
2. **Key naming**: Claude picks namespace/key names following the skill's naming conventions. No API call needed.
3. **Translatable filtering**: Claude's judgment during editing replaces the batch filter API call.
4. **Codemod application**: For simple cases, Claude can edit files directly following the skill's safety rules. For complex/bulk migrations, the existing `safe-i18n apply` command is still available.
5. **Diff planning**: The skill instructs Claude to run `detect` + `analyze` before editing, then `validate` after, keeping changes minimal.

## What is reusable from the existing code

### Directly reusable (copy and adapt)

- **Project detection** (`src/core/project-analyzer.ts`): Framework detection, package manager detection, i18n library detection. Core logic is perfect; just remove the config/manifest coupling.
- **Locale validation** (`src/validators/locale-validator.ts`): Key comparison, duplicate detection, flattenMessages. Fully deterministic.
- **Placeholder validation** (`src/validators/placeholder-validator.ts`): Placeholder extraction and parity checking. Fully deterministic.
- **ICU validation** (`src/validators/icu-validator.ts`): Brace balancing and ICU pattern validation. Fully deterministic.
- **next-intl detection** (`src/adapters/next-intl/detect.ts`): Checks package.json and config files. Fully deterministic.
- **Type definitions** (`src/core/types.ts`): Risk levels, framework enums, validation issue types. Reuse the relevant subset.
- **Risk classifier** (`src/core/risk-classifier.ts`): Rule-based string classification. Fully deterministic.

### Partially reusable (simplify for agent-native)

- **Scanner** (`src/core/scanner.ts`): The AST scanning logic is excellent but depends on Babel, recast, and fast-glob. For the agent-native detect/analyze commands, lighter-weight file discovery may suffice. The full scanner is available via the original package.
- **Config schema** (`src/core/types.ts` Zod schema): Useful as a reference but the agent-native CLI needs a simpler config model focused on detection, not migration orchestration.

### Not reusable (LLM-specific)

- `src/llm/openai-compatible-provider.ts` — Direct API caller, replaced by Claude Code itself
- `src/llm/prompts.ts` — Translation/key-suggestion prompts, replaced by skill instructions
- `src/llm/mock-provider.ts` — Test helper for the provider interface
- `src/llm/provider.ts` — Provider interface, not needed when Claude is the LLM

## What should not be reused

- The entire `src/llm/` directory (provider interface, OpenAI client, prompt builders, mock provider)
- The `translate` command (calls LLM API)
- The `migrate` command's LLM integration (the deterministic parts are fine)
- API key handling and retry logic
- The manifest/rollback system (git is a better rollback mechanism in the agent workflow)

## Future: how the old API-calling behavior could become optional

The existing LLM provider could evolve into a pluggable adapter:

```
translationProvider: "none" | "claude-agent" | "openai" | "anthropic" | "deepl"
```

- `"none"` (default for agent-native): No API calls. Claude fills translations via editing.
- `"claude-agent"`: Claude Code runs the CLI, then fills translations itself.
- `"openai"` / `"anthropic"`: The existing OpenAI-compatible provider, pointing at different endpoints.
- `"deepl"`: A future adapter using the DeepL API for translations.

For this first Claude Code-focused version, the default is `"none"`.
