# Architecture

## System Overview

```
Claude Code
  -> plugin discovery (.claude-plugin/plugin.json)
  -> i18n-migration skill (skills/i18n-migration/SKILL.md)
  -> local deterministic i18n-agent CLI (bin/i18n-agent -> dist/index.js)
  -> project analysis (detect, analyze)
  -> minimal diff plan
  -> Claude edits files
  -> validation (validate)
  -> optional hook feedback (hooks/hooks.json -> scripts/validate-i18n-after-edit.sh)
```

## Plugin Structure

```
i18n-agent-claude-plugin/
  .claude-plugin/
    plugin.json              Plugin manifest — name, version, skill/hook pointers
  skills/
    i18n-migration/
      SKILL.md               Core skill — workflow instructions (always loaded on match)
      reference.md           Extended reference — framework details (loaded on demand)
  hooks/
    hooks.json               PostToolUse hook definition
  scripts/
    validate-i18n-after-edit.sh   Hook script — reads stdin, runs validation
  bin/
    i18n-agent               Executable shell script — calls dist/index.js
  src/                       TypeScript source (compiled to dist/)
    index.ts                 CLI entry point + argument parser
    types.ts                 Shared type definitions
    commands/
      detect.ts              Project detection command
      analyze.ts             Coverage analysis command
      validate.ts            Validation command
      add-locale.ts          Stub locale creation
    core/
      project-detector.ts         Framework detection
      package-manager-detector.ts Package manager detection
      i18n-framework-detector.ts  i18n library detection
      locale-file-discovery.ts    Find locale directories and files
      key-analysis.ts             Key coverage and comparison
      placeholder-analysis.ts     Placeholder extraction and parity
      validation.ts               Orchestrates all validation checks
      stub-generator.ts           Create TODO-placeholder locale content
      diff-planner.ts             Plan file operations for add-locale
    adapters/
      next-intl.ts           next-intl specific detection
      react-i18next.ts       react-i18next specific detection
      i18next.ts             i18next specific detection
      vue-i18n.ts            vue-i18n specific detection
  dist/                      Compiled JavaScript (git-committed for plugin portability)
  package.json               Node dependencies (devDependencies only: TypeScript)
  tsconfig.json              TypeScript config
```

## Design Decisions

### No runtime dependencies

The CLI uses only Node.js built-ins (`fs`, `path`, `child_process`). This keeps the plugin small, fast to install, and free of supply-chain risk. The original `safe-i18n` uses Babel, recast, chalk, ora, fast-glob, and zod — none of which are needed for the plugin's detection/validation focus.

### Compiled JavaScript committed to dist/

Plugin directories are copied into Claude Code's plugin cache. If `dist/` is not committed, the plugin would need a build step after installation, which is not guaranteed by the plugin runtime. Committing `dist/` ensures the plugin works immediately after installation.

### Skill description is compact

Claude loads skill descriptions into context when matching user prompts. A verbose description wastes tokens on every turn. The SKILL.md keeps the description to one sentence. Longer workflow instructions are in the skill body (loaded only when the skill activates). Framework-specific details are in `reference.md` (loaded only when Claude decides it needs them).

### Hook is conservative

The PostToolUse hook only fires on Write/Edit operations. It reads the edited file path from stdin, checks if it's a locale file by path pattern, and only then runs `i18n-agent validate`. It always exits 0 and never modifies files.

## Data Flow

### Detection

```
package.json → framework, i18n library, package manager
config files → i18n framework config existence
lock files   → package manager
messages/    → locale files, base locale, key counts
```

### Validation

```
locale files → JSON parse
            → flatten to dot-separated keys
            → compare key sets (base vs. target)
            → extract {placeholders} and check parity
            → scan raw JSON for duplicate keys
            → check brace balance (ICU syntax)
            → aggregate into ValidationResult
```

### Stub Generation

```
base locale file → parse JSON
                 → walk tree
                 → replace string values with "TODO [locale]: original"
                 → preserve non-string values
                 → write new file
```

## Extension Points

### MCP Server

Each CLI command maps cleanly to an MCP tool:
- `i18n_detect` → project and locale detection
- `i18n_analyze` → coverage analysis
- `i18n_validate` → validation with structured issues
- `i18n_add_locale` → stub creation

### CI Integration

`i18n-agent validate --ci` exits non-zero on errors, ready for GitHub Actions:
```yaml
- run: npx i18n-agent validate --ci
```

### Translation Provider Adapters

Future versions could add optional translation backends:
```
translationProvider: "none" | "claude-agent" | "deepl" | "google"
```

The default remains `"none"` — Claude fills translations by editing files directly.
