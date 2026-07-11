# Using the i18n Agent Toolkit with Claude Code

## Quick Start

1. Build the CLI:

```bash
cd agent-native-i18n/cli
npm install
npm run build
cd ../..
```

2. Copy the skill to your project's Claude skills directory:

```bash
mkdir -p .claude/skills
cp -r agent-native-i18n/claude/skills/i18n-migration .claude/skills/
```

3. Ask Claude Code to help with i18n. The skill will be picked up automatically.

## Example Prompts

### Adding a new language

```
Add Turkish language support to this repo using the i18n migration skill.
```

Claude will:
1. Run `detect` to understand the project
2. Run `analyze` to see current locales
3. Run `add-locale tr --mode stub` to create stub files
4. Optionally fill in translations if asked
5. Run `validate` to verify

### Adding multiple languages

```
Add German, French, and Japanese support to this project.
```

### Fixing missing translations

```
Validate the current i18n setup and fix missing keys without changing existing translations.
```

Claude will:
1. Run `validate` to find issues
2. Add missing keys with TODO placeholders in target locales
3. Run `validate` again to confirm the fix

### Translating stub files

```
The Turkish locale file has TODO placeholders. Please translate them to proper Turkish.
```

Claude will:
1. Read the stub file
2. Replace TODO placeholders with Turkish translations
3. Preserve all `{variable}` placeholders
4. Run `validate` to check placeholder parity

### Migrating hardcoded strings

```
Migrate hardcoded UI strings in src/components/Header.tsx to the existing i18n system. Preserve naming conventions.
```

Claude will:
1. Run `detect` to identify the i18n framework
2. Read the component to find hardcoded strings
3. Add appropriate keys to the base locale file
4. Replace strings with `t("key")` calls
5. Add imports if needed
6. Create stub entries in target locales
7. Run `validate`

### Checking i18n health

```
Show me the i18n coverage report for this project.
```

Claude will run `analyze` and present a summary with coverage percentages.

## Installing the Hook (Optional)

To automatically validate locale files after every edit, add the hook to your Claude Code settings.

1. Review the example:

```bash
cat agent-native-i18n/claude/hooks/hooks.example.json
```

2. Add the PostToolUse hook to `.claude/settings.json` or `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash agent-native-i18n/claude/hooks/validate-i18n-after-edit.sh \"$TOOL_INPUT_FILE_PATH\"",
            "timeout": 15000
          }
        ]
      }
    ]
  }
}
```

The hook only runs validation when locale JSON files are edited. It never makes destructive changes.

## Installing Commands (Optional)

To add reusable commands, copy them to your project's Claude commands directory:

```bash
mkdir -p .claude/commands
cp agent-native-i18n/claude/commands/*.md .claude/commands/
```

Then use them in Claude Code:

```
/add-locale
/validate-i18n
```

## JSON Output Mode

All CLI commands support `--json` for machine-readable output:

```bash
node agent-native-i18n/cli/dist/index.js detect --root . --json
node agent-native-i18n/cli/dist/index.js analyze --root . --json
node agent-native-i18n/cli/dist/index.js validate --root . --json
node agent-native-i18n/cli/dist/index.js add-locale tr --root . --mode stub --json
```

Claude uses JSON output for structured decision-making.

## Relationship to the Original safe-i18n Package

The original `safe-i18n` package in the repository root still works independently. It provides:

- Full AST-based codemod pipeline (scan → plan → apply)
- OpenAI-compatible API integration for translations
- Rollback/manifest system

The agent-native toolkit provides:

- Lighter-weight detection and analysis (no Babel dependency)
- Claude Code skill integration
- Hook and command examples
- Stub-first workflow designed for agent editing

You can use both together. For example, use `safe-i18n scan` for deep AST analysis and `i18n-agent validate` for quick locale checks.
