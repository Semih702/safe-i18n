# Architecture: Agent-Native i18n Toolkit

## Overview

The agent-native i18n toolkit inverts the traditional approach of "CLI calls an LLM API." Instead, Claude Code is the LLM, and the CLI provides deterministic analysis and validation that Claude uses to make informed, safe i18n changes.

```
User prompt
  │
  ▼
Claude Code
  ├─► Skill instructions (SKILL.md)
  │     Teaches Claude the i18n workflow
  │
  ├─► Deterministic CLI (i18n-agent)
  │     ├── detect    → project + framework + locale discovery
  │     ├── analyze   → key coverage, missing/extra keys
  │     ├── validate  → consistency checks, placeholders, ICU
  │     └── add-locale → stub file creation
  │
  ├─► Direct file editing
  │     Claude edits locale files, source code, and config
  │     guided by detection results and skill rules
  │
  └─► Optional hooks
        PostToolUse hook runs validation after locale file edits
```

## Design Principles

### 1. Deterministic core, intelligent agent

The CLI never calls an LLM API. Every CLI command produces the same output for the same input. Claude Code provides the intelligence layer: reading CLI output, making decisions, editing files, and validating results.

### 2. Inspect → Plan → Edit → Validate

Every i18n task follows this cycle:

1. **Inspect**: Run `detect` and `analyze` to understand the project
2. **Plan**: Decide what changes to make based on CLI output
3. **Edit**: Make targeted changes to locale files and source code
4. **Validate**: Run `validate` to catch issues before committing

### 3. Minimal diffs

The toolkit is designed for incremental changes. Adding a locale creates stub files. Fixing translations touches only the affected keys. Validation checks existing files without rewriting them.

### 4. Convention preservation

The CLI detects existing patterns (flat files vs. locale directories, JSON vs. TS, namespace strategy) and all operations follow those patterns. Claude's skill instructions reinforce this.

## Component Architecture

### CLI (`cli/`)

```
cli/
  src/
    index.ts                      Entry point, argument parsing
    types.ts                      Shared type definitions
    commands/
      detect.ts                   Project detection command
      analyze.ts                  Locale analysis command
      validate.ts                 Validation command
      add-locale.ts               Stub locale creation
    core/
      project-detector.ts         Framework, TypeScript, package manager
      i18n-framework-detector.ts  next-intl, react-i18next, i18next, lingui
      locale-file-discovery.ts    Find locale dirs and files
      key-analysis.ts             Key coverage and comparison
      validation.ts               Missing keys, placeholders, ICU, duplicates
      diff-planner.ts             Plan file operations for add-locale
    adapters/
      next-intl.ts                next-intl specific detection
      react-i18next.ts            react-i18next specific detection
      i18next.ts                  i18next specific detection
```

### Claude Integration (`claude/`)

```
claude/
  skills/
    i18n-migration/
      SKILL.md                    Main skill — workflow instructions for Claude
  hooks/
    hooks.example.json            Example PostToolUse hook config
    validate-i18n-after-edit.sh   Hook script for auto-validation
  commands/
    add-locale.md                 Reusable command: add a locale
    validate-i18n.md              Reusable command: validate i18n
```

## Data Flow

### Detection Flow

```
project root
  │
  ├─► project-detector
  │     reads: package.json, next.config.*, tsconfig.json, lock files
  │     outputs: framework, TypeScript, router, package manager
  │
  ├─► i18n-framework-detector
  │     reads: package.json dependencies, config file candidates
  │     outputs: library name, version, config path
  │
  └─► locale-file-discovery
        reads: messages/, locales/, i18n/, translations/, lang/
        outputs: locale list, base locale, file pattern
```

### Validation Flow

```
locale files
  │
  ├─► JSON parse check
  ├─► Key comparison (base vs. target)
  │     ├── missing keys → error
  │     └── unused keys → warning
  ├─► Placeholder parity
  │     {var} in base must exist in target and vice versa
  ├─► Duplicate key scan
  │     raw text analysis for repeated keys at same depth
  └─► ICU syntax check
        balanced braces, plural/select structure
```

## Future Extension Points

### MCP Server

The CLI commands can be exposed as MCP tools:

```json
{
  "tools": [
    { "name": "i18n_detect", "description": "Detect project i18n setup" },
    { "name": "i18n_analyze", "description": "Analyze locale coverage" },
    { "name": "i18n_validate", "description": "Validate locale consistency" },
    { "name": "i18n_add_locale", "description": "Create stub locale" }
  ]
}
```

This would let any MCP-compatible client (Claude Code, Cursor, etc.) use the toolkit without shell commands.

### Claude Plugin

A future Claude plugin could bundle the skill + CLI into a single installable unit that auto-registers with Claude Code.

### Codex / OpenAI Agent Support

The CLI's JSON output mode makes it compatible with any agent framework. The skill instructions could be adapted to OpenAI's agent system prompt format.

### CI/GitHub Action

```yaml
- name: Validate i18n
  run: npx i18n-agent validate --root . --ci
```

The `--ci` flag already exits non-zero on errors, making it ready for CI pipelines.

### Translation Provider Adapters

The agent-native approach defaults to `translationProvider: "none"` (Claude fills translations directly). Future adapters could add:

- `"deepl"` — DeepL API for professional translations
- `"google"` — Google Cloud Translation
- `"anthropic"` — Claude API for batch translation
- `"openai"` — OpenAI API (the original safe-i18n approach)

These would be optional add-ons, not requirements.
