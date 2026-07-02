# Testing Guide for safe-i18n

This document covers how to set up, run, and extend the test suite for the safe-i18n CLI.

## Prerequisites

- **Node.js 18+** (required by the `engines` field in package.json)
- **npm** (comes with Node.js)

Verify your versions:

```bash
node --version   # Must be >= 18.0.0
npm --version
```

## Setting Up the Development Environment

```bash
git clone https://github.com/user/safe-i18n.git
cd safe-i18n
npm install
npm run build
```

The `npm run build` step uses [tsup](https://tsup.egoist.dev/) to compile TypeScript into the `dist/` directory. You must build before running the CLI locally.

For continuous rebuilding during development:

```bash
npm run dev
```

## Running Unit Tests

safe-i18n uses [Vitest](https://vitest.dev/) as its test runner. The test configuration is in `vitest.config.ts` and runs all files matching `tests/**/*.test.ts` with a 30-second timeout per test.

Run the full test suite once:

```bash
npm test
```

### Running Tests in Watch Mode

Watch mode re-runs tests automatically when source or test files change. This is the recommended workflow during active development:

```bash
npm run test:watch
```

### Unit Test Files

The unit tests live in `tests/unit/` and cover the core modules:

| Test file | What it covers |
|---|---|
| `scanner.test.ts` | String extraction from JSX text, attributes (placeholder, aria-label, alt), conditional strings, component type detection, route inference |
| `risk-classifier.test.ts` | All four risk categories: AUTO_SAFE, REVIEW_REQUIRED, SKIP_NON_UI, SKIP_DANGEROUS |
| `planner.test.ts` | Migration plan generation, action mapping, key deduplication, summary counts |
| `transforms.test.ts` | AST transform safety checks, safe-only mode, empty entry handling |
| `safety.test.ts` | Transform safety validation, hook compatibility, server component checks |
| `config.test.ts` | Config loading, defaults, write/read round-trip |
| `messages.test.ts` | Nested key setting, message merging, locale file generation |
| `paths.test.ts` | Path security checks, config path generation |
| `validators.test.ts` | Missing key detection, placeholder parity validation |
| `mock-provider.test.ts` | Mock translation provider, locale prefixing, variable preservation |
| `project-analyzer.test.ts` | Framework detection (Next.js App Router, React Vite), package manager detection |

## Test Fixtures

Fixtures are located in `tests/fixtures/`. These are minimal project structures that simulate real React and Next.js applications. The unit tests run the scanner, planner, and other modules against these fixtures.

### `next-basic/`

A minimal Next.js App Router project with straightforward hardcoded strings. This is the primary fixture for testing the happy path of scanning and planning.

- `app/page.tsx` -- Simple homepage with h1, p, button (all AUTO_SAFE)
- `app/settings/page.tsx` -- Form with labels, inputs, placeholder attributes
- `app/layout.tsx` -- Root layout
- `components/Header.tsx` -- Client component with `"use client"`, useState, aria-label, navigation links

### `next-with-risky-strings/`

A Next.js project specifically designed to test risk classification. Contains strings that should be flagged as risky or skipped entirely:

- Conditional expressions (`status === "loading" ? "Loading..." : "Ready"`)
- Template literals (`` `Welcome back, ${user.name}` ``)
- API paths (`"/api/v1/users"`)
- localStorage calls
- console.log analytics event names
- Comparison operands (`user.role === "admin"`)
- data-testid attributes
- className strings

### `react-basic/`

A plain React project (no Next.js) with a simple component tree (`App`, `Header`, `Footer`). Used to verify that the scanner, transforms, and framework detection work outside the Next.js ecosystem.

### `locale-validation/`

A pre-existing i18n setup with locale files and a `safe-i18n.config.json`. Used to test the `validate` command and locale file consistency checks.

- `messages/en.json` -- Source locale with `{name}` placeholder in greeting, three keys under `common`, three under `settings`
- `messages/tr.json` -- Turkish translation intentionally missing the `common.delete` key and the `{name}` placeholder in `greeting`
- `safe-i18n.config.json` -- Config pointing to `next-intl` adapter with `en` as source locale and `tr` as target

These intentional gaps exercise missing key detection and placeholder parity validation.

## Testing the CLI Locally Against Fixtures

After building (`npm run build`), you can run the CLI directly against any fixture:

```bash
# Scan for translatable strings
cd tests/fixtures/next-basic
node ../../../dist/cli/index.js scan

# Create a migration plan (no files are modified)
node ../../../dist/cli/index.js plan

# Apply only safe (low-risk) transformations
node ../../../dist/cli/index.js apply --safe-only --allow-dirty

# Apply with a dry run (preview changes without writing files)
node ../../../dist/cli/index.js apply --safe-only --allow-dirty --dry-run

# Generate translations with the mock provider (no API key needed)
node ../../../dist/cli/index.js translate --to tr,de --provider mock

# Validate locale files for consistency
node ../../../dist/cli/index.js validate

# Roll back all applied changes
node ../../../dist/cli/index.js rollback
```

You can also test against the risky-strings fixture to verify that dangerous strings are properly flagged:

```bash
cd tests/fixtures/next-with-risky-strings
node ../../../dist/cli/index.js scan
node ../../../dist/cli/index.js plan
```

Or against the locale-validation fixture to test validation:

```bash
cd tests/fixtures/locale-validation
node ../../../dist/cli/index.js validate
```

## Creating and Testing the npm Package

### How to Pack

```bash
npm pack
```

This produces `safe-i18n-0.1.0.tgz` in the project root. Only the files listed in the `files` field of `package.json` are included: `dist/`, `README.md`, and `LICENSE`.

### How to Test Inside Another Project

Install the local tarball in any React or Next.js project to simulate what end users experience:

```bash
cd /path/to/target-project
npm install /path/to/safe-i18n/safe-i18n-0.1.0.tgz
npx safe-i18n scan
```

## Testing Against Real Open-Source Repos

To test safe-i18n against a real codebase, clone the target repo and run the full workflow:

```bash
git clone <target-repo>
cd <target-repo>

# Initialize configuration (detects your project structure)
npx safe-i18n init --source en --locales tr,de,fr

# Scan for hardcoded strings
npx safe-i18n scan

# Create a migration plan
npx safe-i18n plan --source en --locales tr,de,fr

# Apply only safe transformations
npx safe-i18n apply --safe-only

# Generate translations using the mock provider (no API key needed)
npx safe-i18n translate --to tr,de,fr --provider mock

# Validate the generated locale files
npx safe-i18n validate
```

See `OPEN_SOURCE_TARGETS.md` for a curated list of real open-source repositories that are good candidates for testing.

## Type Checking

Run the TypeScript compiler in check-only mode (no output):

```bash
npm run typecheck
```

This uses the configuration in `tsconfig.json` with `--noEmit` to catch type errors without producing build artifacts.

## Linting

Run ESLint across the `src/` and `tests/` directories:

```bash
npm run lint
```

To auto-format code with Prettier:

```bash
npm run format
```

To check formatting without modifying files:

```bash
npm run format:check
```

## Adding New Test Fixtures

1. Create a new directory under `tests/fixtures/` with a descriptive name (e.g., `next-with-dynamic-routes`).

2. Add the minimum files needed to simulate the scenario:
   - `package.json` with the relevant framework dependencies
   - Source files (`.tsx`/`.ts`) containing the strings you want to test
   - Optionally a `safe-i18n.config.json` if the fixture needs custom configuration
   - Optionally a `messages/` directory with existing locale files if testing validation

3. Reference the new fixture directory in your unit tests:
   ```typescript
   const fixtureRoot = path.resolve(__dirname, "../fixtures/your-fixture-name");
   ```

4. Keep fixtures minimal. Each fixture should test one specific behavior or edge case. Avoid adding unnecessary files or dependencies.

5. Run the full test suite to make sure nothing breaks:
   ```bash
   npm test
   ```

## Adding New Unit Tests

Tests use Vitest. Place new test files in `tests/unit/` with the `.test.ts` extension.

```typescript
import { describe, it, expect } from "vitest";

describe("feature", () => {
  it("does something", () => {
    expect(true).toBe(true);
  });
});
```

Vitest globals (`describe`, `it`, `expect`) are available without imports because `globals: true` is set in `vitest.config.ts`, but explicit imports are recommended for clarity.
