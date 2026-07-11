# Validate the project's i18n setup using the i18n-agent workflow

Run a comprehensive i18n validation and report results.

## Steps

1. Run project detection:
   ```bash
   node agent-native-i18n/cli/dist/index.js detect --root . --json
   ```

2. Run full analysis to understand the current state:
   ```bash
   node agent-native-i18n/cli/dist/index.js analyze --root .
   ```

3. Run validation:
   ```bash
   node agent-native-i18n/cli/dist/index.js validate --root . --ci
   ```

4. For each issue found, explain:
   - What the issue is
   - Why it matters
   - How to fix it

5. Offer to fix the issues if the user agrees.

## Checks Performed

- Missing keys (present in base locale but absent in target)
- Unused keys (present in target but not in base)
- Placeholder mismatches (`{variable}` parity between locales)
- Duplicate keys at the same nesting level
- ICU syntax (unbalanced braces)
- JSON parse errors

## Important

- Do not change existing translations to fix validation issues
- Only add missing keys with stub values
- Only remove truly unused keys if the user confirms
- Never modify the base locale file to match targets
