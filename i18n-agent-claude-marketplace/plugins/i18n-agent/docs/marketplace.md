# Marketplace Distribution

## Three Distribution Paths

### 1. Local Development (`--plugin-dir`)

For development and personal use:

```bash
claude --plugin-dir ./i18n-agent-claude-plugin
```

No registration or approval needed. The plugin is loaded from the local filesystem.

### 2. Personal / Team Marketplace

For sharing within a team or organization:

- Host the plugin in a git repository
- Create a marketplace manifest that points to the plugin
- Team members add the marketplace URL to their Claude Code config

Example marketplace structure:

```
my-marketplace/
  .claude-plugin/
    marketplace.json
  plugins/
    i18n-agent/
      ... (full plugin contents)
```

Where `marketplace.json` contains:

```json
{
  "name": "my-team-tools",
  "plugins": [
    {
      "name": "i18n-agent",
      "path": "./plugins/i18n-agent"
    }
  ]
}
```

### 3. Claude Community Marketplace

For public distribution:

1. Ensure the plugin passes `claude plugin validate --strict`
2. Follow the submission checklist in `docs/submission-checklist.md`
3. Submit to the Claude Code community marketplace

**Note:** Community marketplace inclusion is curated by Anthropic. Submission does not guarantee acceptance. Meeting technical requirements is necessary but not sufficient.

## Preparing for Marketplace Submission

### Self-Containment

The plugin must be fully self-contained:

- All source, compiled output, scripts, and docs must be inside the plugin directory
- No `../` references to files outside the plugin root
- Use `${CLAUDE_PLUGIN_ROOT}` in hooks and scripts to reference plugin files
- All dependencies must be bundled or limited to Node.js built-ins

### Metadata Quality

- `plugin.json` must have accurate `name`, `displayName`, `version`, `description`
- Keywords should help discoverability
- License must be declared
- Repository URL must be valid (if included)

### Version Management

Follow semantic versioning:

- `0.1.0` — Initial release, feature-complete for core use cases
- `0.2.0` — New features (e.g., YAML support, new adapters)
- `1.0.0` — Stable API, production-ready

## npm as Secondary Channel

The plugin can also be distributed via npm for non-Claude-Code use cases:

```bash
npm install -g i18n-agent-claude-plugin
```

This would make the `i18n-agent` CLI available globally. However, the skill and hooks only function within Claude Code.
