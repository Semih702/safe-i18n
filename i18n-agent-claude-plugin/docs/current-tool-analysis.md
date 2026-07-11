# Current Tool Analysis: safe-i18n

## Package Overview

| Field | Value |
|-------|-------|
| Name | `safe-i18n` |
| Version | `0.1.0` |
| Entry | `dist/cli/index.js` (bin: `safe-i18n`) |
| Language | TypeScript (ESM) |
| License | MIT |
| Build | tsup |
| Test | vitest |

## What the existing tool does

`safe-i18n` is an AI-assisted i18n migration CLI for React/Next.js projects. It enforces a strict boundary: deterministic AST transforms handle all source code changes, while an LLM (via OpenAI-compatible API) handles only translations, key naming, and string classification.

### CLI Commands

| Command | Deterministic? | Uses LLM? | Purpose |
|---------|---------------|-----------|---------|
| `init` | Yes | No | Detect project, write config |
| `scan` | Yes | No | Find hardcoded strings via Babel AST, classify by risk |
| `plan` | Partially | Yes (key suggestions) | Create migration plan JSON |
| `apply` | Yes | No | Execute AST codemods from plan |
| `translate` | No | Yes | Generate translations via API |
| `validate` | Yes | No | Check locale file consistency |
| `rollback` | Yes | No | Restore files from manifest |
| `migrate` | Mixed | Yes | All-in-one pipeline |
| `sync` | Mixed | Yes | Catch up new strings |
| `add-locale` | Mixed | Yes | Add new target language |
| `reset` | Yes | No | Clean manifests |

### Important Source Files

| Path | Purpose | Reusable? |
|------|---------|-----------|
| `src/core/project-analyzer.ts` | Detect framework, package manager, i18n lib | Yes |
| `src/core/scanner.ts` | Babel AST string extraction | Yes (heavy deps) |
| `src/core/risk-classifier.ts` | Rule-based risk classification | Yes |
| `src/core/types.ts` | Type definitions, Zod config schema | Yes (subset) |
| `src/core/config.ts` | Config read/write | Yes (simplified) |
| `src/validators/locale-validator.ts` | Missing/unused keys, duplicate keys | Yes |
| `src/validators/placeholder-validator.ts` | Placeholder `{var}` parity | Yes |
| `src/validators/icu-validator.ts` | ICU syntax validation | Yes |
| `src/adapters/next-intl/detect.ts` | next-intl detection | Yes |
| `src/llm/provider.ts` | LLM provider interface | No |
| `src/llm/openai-compatible-provider.ts` | OpenAI API client | No |
| `src/llm/prompts.ts` | Translation/classification prompts | No |
| `src/llm/mock-provider.ts` | Test stub provider | No |

## Which parts are deterministic and reusable

These modules contain zero LLM dependency and can be copied/adapted:

1. **Project detection** (`project-analyzer.ts`): Framework detection (Next.js App/Pages Router, React CRA/Vite), TypeScript detection, package manager detection, existing i18n library detection.

2. **Locale validation** (`locale-validator.ts`): Key comparison (missing/unused), duplicate key scanning via raw JSON text analysis, `flattenMessages()` utility.

3. **Placeholder validation** (`placeholder-validator.ts`): Extract `{name}` placeholders, check parity between source and target locales.

4. **ICU validation** (`icu-validator.ts`): Balanced brace checking, `plural`/`select`/`selectordinal` structure validation.

5. **Risk classification** (`risk-classifier.ts`): Rule-based heuristics for AUTO_SAFE, REVIEW_REQUIRED, SKIP_NON_UI, SKIP_DANGEROUS.

6. **next-intl detection** (`adapters/next-intl/detect.ts`): Check package.json, probe config file candidates.

7. **Type definitions** (`types.ts`): Risk levels, framework enums, validation issue types, config schema.

## Which parts depend on direct LLM API calls

The entire `src/llm/` directory:

- `provider.ts` — `TranslationProvider` interface with `translate()`, `translateBatch()`, `suggestKey()`, `filterTranslatable()`
- `openai-compatible-provider.ts` — HTTP client calling `/chat/completions` with retry logic
- `prompts.ts` — System/user prompt builders for translation, batch translation, key suggestion, and filter tasks
- `mock-provider.ts` — Test double that prefixes strings with `[TR]`

Commands that call the LLM: `translate`, `migrate`, `sync`, `add-locale` (for real translations), `plan` (for key suggestions).

## Which parts should be copied into the plugin

Copy and adapt (lighter-weight, no Babel/recast dependency):

1. Project detection logic from `project-analyzer.ts`
2. Locale file discovery (new implementation, no config coupling)
3. Validation logic from all three validators
4. Key analysis (flatten, compare, coverage)
5. Stub generation (copy key structure with TODO values)
6. Type subset (validation issues, framework enums)

## Which parts should NOT be reused

- `src/llm/*` — The plugin replaces LLM API calls with Claude Code itself
- `src/codemod/*` — Babel AST transforms are heavy; Claude edits code directly
- `src/core/scanner.ts` — Requires Babel parser (68KB+ dependency tree)
- `src/core/manifest.ts` — Rollback manifests; git handles this in the agent workflow
- `src/core/planner.ts` — Migration planner coupled to LLM key suggestions

## How the old design differs from the new plugin design

| Aspect | safe-i18n (old) | i18n-agent plugin (new) |
|--------|----------------|------------------------|
| Architecture | CLI calls external LLM API | Claude Code IS the LLM |
| Translation | API call to OpenAI → response | Claude edits files directly |
| Key naming | API call for suggestions | Claude follows skill conventions |
| String classification | API call for filtering | Claude's judgment during editing |
| Code transforms | Babel AST codemod | Claude edits source files |
| Rollback | Custom manifest system | git |
| Dependencies | Babel, recast, zod, chalk, ora | Node built-ins only |
| API keys | Required (OPENAI_API_KEY) | None |
| Distribution | npm package | Claude Code plugin marketplace |
| Discovery | npm search, AGENTS.md | Plugin skill auto-matching |
