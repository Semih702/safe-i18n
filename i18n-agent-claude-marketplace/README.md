# i18n Agent — Claude Code Marketplace

This is a local marketplace scaffold for the `i18n-agent` Claude Code plugin.

## Structure

```
i18n-agent-claude-marketplace/
  .claude-plugin/
    marketplace.json       Marketplace manifest
  plugins/
    i18n-agent/            Full plugin (copied from i18n-agent-claude-plugin/)
```

## Local Development

This scaffold is for local development and testing. For real marketplace distribution, the plugin should live inside this directory under `plugins/i18n-agent/`.

### Setup

Copy the plugin into the marketplace:

```bash
cp -r i18n-agent-claude-plugin i18n-agent-claude-marketplace/plugins/i18n-agent
```

### Test

```bash
claude --marketplace-dir ./i18n-agent-claude-marketplace
```

## Distribution Notes

For real marketplace distribution, you have several options:

1. **Git repository marketplace**: Host this directory as a git repo. Team members add the repo URL to their Claude Code config.

2. **npm marketplace**: Publish the plugin as an npm package. The marketplace entry would reference the npm package name instead of a local path.

3. **Community marketplace**: Submit directly to Anthropic's curated community marketplace (does not require a separate marketplace repo).

The `marketplace.json` in this scaffold uses a local `./plugins/i18n-agent` path, which is the correct format for a self-contained marketplace repository.
