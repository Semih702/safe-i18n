# i18n Agent — Claude Code Plugin

A Claude Code plugin for safe, deterministic i18n migration, locale validation, missing-key detection, and new-language setup in JavaScript and TypeScript projects.

## Why a plugin instead of an npm package?

The traditional approach:
```
npm package → calls LLM API → gets translations → writes files
```

The plugin approach:
```
User asks Claude → plugin skill activates → deterministic CLI analyzes project
→ Claude edits files intelligently → CLI validates result
```

**Benefits:**

- **No API keys.** Claude Code is the LLM — no separate translation API needed.
- **Better context.** Claude sees the full project, not just extracted strings.
- **Safer edits.** Deterministic analysis before and after every change.
- **Auto-discovery.** Claude Code's skill system activates the workflow when the user asks about i18n.
- **Reviewable.** All changes are normal file edits, not opaque API responses.
- **Zero config.** No `safe-i18n.config.json` needed — the CLI auto-detects everything.

## Supported Frameworks

- **next-intl** (Next.js)
- **react-i18next** (React)
- **i18next** (any JS/TS)
- **vue-i18n** (Vue/Nuxt)

## Quick Start

### Local Development

```bash
# Build the CLI
cd i18n-agent-claude-plugin
npm install
npm run build

# Run Claude Code with the plugin loaded
claude --plugin-dir ./i18n-agent-claude-plugin
```

### Using Naturally

Once the plugin is loaded, just ask Claude:

```
Add Turkish language support to this repo.
```

```
Validate the i18n setup and fix missing keys.
```

```
Migrate hardcoded strings in this component to next-intl.
```

The skill activates automatically when your request involves i18n, localization, or translation.

### Invoking Explicitly

```
/i18n-agent:i18n-migration Add Turkish support
```

### CLI Commands

The plugin adds `i18n-agent` to Claude Code's PATH. Claude uses these commands, and you can run them directly too:

```bash
i18n-agent detect          # Detect framework, i18n library, locale files
i18n-agent analyze         # Produce locale coverage report
i18n-agent validate        # Check locale file consistency
i18n-agent add-locale tr   # Create stub locale files
i18n-agent doctor          # Check plugin health
```

All commands support `--json` for structured output and `--root <path>` to override the project root.

## How It Works

```
Claude Code
  │
  ├─► Plugin discovery (plugin.json)
  │
  ├─► Skill activation (SKILL.md)
  │     Triggers on: i18n, localization, translation,
  │     add language, fix keys, validate, migrate strings
  │
  ├─► Deterministic CLI (i18n-agent)
  │     ├── detect     → project + framework + locale discovery
  │     ├── analyze    → key coverage, missing/extra keys
  │     ├── validate   → consistency, placeholders, ICU syntax
  │     ├── add-locale → stub file creation
  │     └── doctor     → environment check
  │
  ├─► Claude edits files directly
  │     Guided by skill rules and CLI output
  │
  └─► Optional hook
        PostToolUse runs validation after locale file edits
```

## Validation

The plugin validates locale files for:

- **Missing keys** — present in base locale but absent in target
- **Unused keys** — present in target but not in base
- **Placeholder mismatches** — `{variable}` parity between locales
- **Duplicate keys** — repeated keys at the same nesting level
- **ICU syntax** — unbalanced braces in message format strings
- **JSON parse errors** — malformed locale files

## Security Model

- **No API calls.** The CLI never contacts any external service.
- **No API keys.** Nothing is required or stored.
- **No file deletion.** The CLI only creates new files (add-locale) and reads existing ones.
- **Non-destructive hook.** The PostToolUse hook only reads and validates — it never modifies files.
- **Fail-safe.** The hook always exits 0 so it never blocks Claude.

## Validating the Plugin

```bash
claude plugin validate ./i18n-agent-claude-plugin --strict
```

## Inspecting Token Cost

```bash
claude plugin details i18n-agent
```

The skill description is compact (~200 tokens). Longer reference material is in a separate file that Claude loads only when needed.

## Testing Locally

```bash
# 1. Build
cd i18n-agent-claude-plugin && npm install && npm run build && cd ..

# 2. Run with plugin
claude --plugin-dir ./i18n-agent-claude-plugin

# 3. Reload if needed
/reload-plugins

# 4. Test naturally
> Add Turkish language support to this project.

# 5. Or test explicitly
> /i18n-agent:i18n-migration Validate the i18n setup.
```

## Limitations

- **JSON locale files only.** YAML, TypeScript, and JavaScript locale files are detected but not deeply analyzed.
- **No AST scanning.** The plugin does not scan source code for hardcoded strings (the original `safe-i18n` npm package does). Claude reads files directly instead.
- **Stub translations only by default.** Real translations require the user to explicitly ask Claude to translate.
- **Single base locale.** The CLI assumes one base locale (typically `en`) as the source of truth.

## Roadmap

- MCP server wrapper for richer tool integration
- YAML locale file support
- Translation memory / glossary file support
- CI/GitHub Action for `validate --ci`
- Community marketplace submission
- npm distribution as a secondary channel

## License

MIT
