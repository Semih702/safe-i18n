# Marketplace Submission Checklist

Complete all items before submitting to the Claude Code community marketplace.

## Technical Requirements

- [ ] Plugin validates with `claude plugin validate --strict`
- [ ] Plugin is self-contained (no external file references)
- [ ] No paths reference files outside the plugin root directory
- [ ] `${CLAUDE_PLUGIN_ROOT}` used in hooks and scripts (not hardcoded paths)
- [ ] `dist/` is committed and up to date with source
- [ ] `bin/i18n-agent` is executable (`chmod +x`)
- [ ] CLI works on macOS, Linux, and Windows (Git Bash)
- [ ] Node.js >= 18 is the only runtime requirement

## Security

- [ ] No external LLM or API calls
- [ ] No secrets, API keys, or credentials required
- [ ] No network requests of any kind
- [ ] Hook script is non-destructive (read-only validation)
- [ ] Hook script always exits 0 (never blocks Claude)
- [ ] README documents the security model
- [ ] No sensitive data logged or stored

## Quality

- [ ] README explains what the plugin does
- [ ] README explains how to use it (natural language, explicit invocation, CLI)
- [ ] README documents limitations honestly
- [ ] Skill description is specific and under 200 tokens
- [ ] Skill body covers all advertised workflows
- [ ] Reference.md covers framework-specific details
- [ ] Architecture.md explains the design
- [ ] Testing.md includes reproducible test steps
- [ ] License file is present and matches plugin.json

## Functionality

- [ ] `i18n-agent detect` works on a Next.js project
- [ ] `i18n-agent detect` works on a React project
- [ ] `i18n-agent detect` works on a Vue project
- [ ] `i18n-agent analyze` produces correct coverage report
- [ ] `i18n-agent validate` catches missing keys
- [ ] `i18n-agent validate` catches placeholder mismatches
- [ ] `i18n-agent validate` catches duplicate keys
- [ ] `i18n-agent validate --ci` exits non-zero on errors
- [ ] `i18n-agent add-locale` creates correct stub files
- [ ] `i18n-agent doctor` reports environment status
- [ ] `--json` flag produces valid JSON on all commands
- [ ] Hook triggers only on locale file edits (not all files)
- [ ] Tested on at least one real i18n project

## Metadata

- [ ] `plugin.json` name matches the plugin directory name
- [ ] Version follows semver (`0.1.0`)
- [ ] Repository URL is correct and accessible
- [ ] Keywords are relevant and not spammy
- [ ] Author information is accurate

## Token Efficiency

- [ ] `claude plugin details i18n-agent` shows acceptable token cost
- [ ] Skill description is concise (single sentence)
- [ ] Long reference material is in separate files, not inlined
- [ ] Hook script output is concise
