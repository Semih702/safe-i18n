# Testing

## Build the Plugin

```bash
cd i18n-agent-claude-plugin
npm install
npm run build
```

## Validate Plugin Structure

```bash
claude plugin validate ./i18n-agent-claude-plugin --strict
```

This checks:
- `plugin.json` is valid
- Skill files exist at declared paths
- Hook files exist at declared paths
- No references to files outside the plugin root

## Local Testing with Claude Code

```bash
# Start Claude Code with the plugin loaded
claude --plugin-dir ./i18n-agent-claude-plugin

# Reload plugins if you make changes during a session
/reload-plugins
```

## Test Commands

### Natural language (skill auto-match)

```
Add Turkish language support to this repo.
```

```
Validate the i18n setup and fix missing keys.
```

```
Migrate hardcoded strings in src/components/Header.tsx to next-intl.
```

### Explicit skill invocation

```
/i18n-agent:i18n-migration Add Turkish language support to this repo.
```

### Direct CLI

```bash
i18n-agent detect
i18n-agent analyze
i18n-agent validate --ci
i18n-agent add-locale tr --mode stub
i18n-agent doctor
```

## Test on Real Projects

Recommended test projects (any Next.js or React app with i18n):

1. **Project with existing i18n**: Should detect framework, find locales, show coverage
2. **Project without i18n**: Should detect framework, report no locales found
3. **Project with missing keys**: Should report missing keys in validation
4. **Add-locale test**: Create a stub, verify it has the right keys, validate

### Minimal test setup

```bash
mkdir /tmp/test-i18n && cd /tmp/test-i18n
npm init -y
npm install next-intl
mkdir messages
echo '{"home": {"title": "Welcome", "subtitle": "Hello world"}}' > messages/en.json

# Test detection
i18n-agent detect --root .

# Test analysis
i18n-agent analyze --root .

# Test add-locale
i18n-agent add-locale tr --root . --mode stub

# Test validation
i18n-agent validate --root .
```

## Inspect Token Cost

```bash
claude plugin details i18n-agent
```

The skill description should be under 200 tokens. The full SKILL.md body loads only on activation.
