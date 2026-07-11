# Add a new locale using the i18n-agent workflow

Add a new locale to this project following the structured i18n workflow.

## Steps

1. Run project detection to understand the current i18n setup:
   ```bash
   node agent-native-i18n/cli/dist/index.js detect --root . --json
   ```

2. Run analysis to see existing locale coverage:
   ```bash
   node agent-native-i18n/cli/dist/index.js analyze --root .
   ```

3. Create stub locale file(s) for the requested locale:
   ```bash
   node agent-native-i18n/cli/dist/index.js add-locale <LOCALE_CODE> --root . --mode stub
   ```

4. If the user wants real translations (not just stubs), open each stub file and replace the `TODO [<locale>]: ...` placeholders with proper translations. Preserve all `{variable}` placeholders.

5. Validate the result:
   ```bash
   node agent-native-i18n/cli/dist/index.js validate --root .
   ```

6. Report what was created, how many keys were added, and whether validation passed.

## Important

- Preserve the existing locale file structure and naming conventions
- Do not modify the base locale file
- Do not remove or change existing translations in other locales
- Prefer stub/TODO values over guessed translations unless explicitly asked to translate
