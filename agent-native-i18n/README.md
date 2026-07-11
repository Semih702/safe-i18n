# Agent-Native i18n Toolkit

A Claude Code-first i18n toolkit for React and Next.js projects. Instead of calling an LLM API from the CLI, this toolkit provides deterministic analysis tools that Claude Code uses to make safe, informed i18n changes.

## Why this approach?

The traditional approach:
```
CLI → calls LLM API → gets translations → writes files
```

The agent-native approach:
```
User asks Claude → Claude runs CLI for analysis → Claude edits files intelligently → CLI validates
```

Benefits:
- **No API keys required.** Claude Code is the LLM — no separate translation API needed.
- **Better context.** Claude sees the full project, not just extracted strings.
- **Safer edits.** Deterministic analysis before and after every change.
- **Discoverable.** Claude Code's skill system makes the toolkit automatically available when relevant.
- **Reviewable.** All changes are visible as normal file edits, not opaque API responses.

## Structure

```
agent-native-i18n/
  README.md                              This file
  docs/
    current-tool-analysis.md             Analysis of the original safe-i18n package
    architecture.md                      Architecture documentation
    usage-with-claude-code.md            Usage guide with examples
  cli/                                   Deterministic CLI (no LLM calls)
    package.json
    tsconfig.json
    src/
      index.ts                           CLI entry point
      types.ts                           Type definitions
      commands/
        detect.ts                        Project detection
        analyze.ts                       Locale coverage analysis
        validate.ts                      Locale file validation
        add-locale.ts                    Stub locale creation
      core/
        project-detector.ts              Framework and environment detection
        i18n-framework-detector.ts       i18n library detection
        locale-file-discovery.ts         Find locale directories and files
        key-analysis.ts                  Key comparison and coverage
        validation.ts                    Validation rules
        diff-planner.ts                  Plan file operations
      adapters/
        next-intl.ts                     next-intl adapter
        react-i18next.ts                 react-i18next adapter
        i18next.ts                       i18next adapter
  claude/                                Claude Code integration
    skills/
      i18n-migration/
        SKILL.md                         Skill definition for Claude Code
    hooks/
      hooks.example.json                 Example hook configuration
      validate-i18n-after-edit.sh        Validation hook script
    commands/
      add-locale.md                      Reusable add-locale command
      validate-i18n.md                   Reusable validation command
```

## Quick Start

### 1. Build the CLI

```bash
cd agent-native-i18n/cli
npm install
npm run build
```

### 2. Run commands

```bash
# Detect project setup
node dist/index.js detect --root /path/to/project

# Analyze locale coverage
node dist/index.js analyze --root /path/to/project

# Add a new locale (stub mode)
node dist/index.js add-locale tr --root /path/to/project --mode stub

# Validate locale files
node dist/index.js validate --root /path/to/project --ci
```

### 3. Install the Claude Code Skill

Copy the skill into your project's `.claude/skills/` directory:

```bash
mkdir -p .claude/skills
cp -r agent-native-i18n/claude/skills/i18n-migration .claude/skills/
```

### 4. Use with Claude Code

Ask Claude naturally:

- "Add Turkish language support to this project"
- "Validate the i18n setup and fix missing keys"
- "Migrate hardcoded strings in this component to i18n"

Claude will use the skill to run the CLI, analyze results, and make safe changes.

### 5. (Optional) Install hooks

See `claude/hooks/hooks.example.json` for an example PostToolUse hook that runs validation after locale file edits.

### 6. (Optional) Install commands

```bash
mkdir -p .claude/commands
cp agent-native-i18n/claude/commands/*.md .claude/commands/
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `detect` | Detect framework, i18n library, locale files, package manager |
| `analyze` | Show locale coverage report with missing/extra keys |
| `validate` | Check locale files for consistency issues |
| `add-locale <code>` | Create stub locale file(s) with TODO placeholders |

All commands support `--root <path>` and `--json` flags.

## Relationship to safe-i18n

This toolkit complements the original `safe-i18n` package in the repository root. The original package provides deep AST scanning, codemod application, and LLM-powered translation via API. This toolkit provides lightweight detection, analysis, and validation designed for Claude Code's agent workflow.

Both can be used together. Use `safe-i18n` for bulk AST-based migrations. Use `i18n-agent` for ongoing locale management with Claude Code.

## Future Plans

- **MCP server**: Expose CLI commands as MCP tools
- **Claude plugin**: Bundle skill + CLI into an installable plugin
- **CI integration**: GitHub Action for i18n validation
- **Translation adapters**: Optional DeepL, Google Translate, Anthropic API adapters
- **Codex support**: Adapt skill instructions for other agent frameworks
