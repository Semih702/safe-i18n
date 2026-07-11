#!/usr/bin/env bash
#
# validate-i18n-after-edit.sh
#
# Claude Code hook script that runs i18n validation after a locale file is edited.
# Intended for use as a PostToolUse hook on Edit/Write tools.
#
# Usage:
#   bash validate-i18n-after-edit.sh "$TOOL_INPUT_FILE_PATH"
#
# This script:
#   1. Checks if the edited file is a locale/translation file
#   2. If so, runs the i18n-agent validate command
#   3. Prints validation results
#   4. Never makes destructive changes
#

EDITED_FILE="${1:-}"

# Only run for JSON files in common locale directories
case "$EDITED_FILE" in
  */messages/*.json | */locales/*.json | */locale/*.json | \
  */i18n/*.json | */translations/*.json | */lang/*.json | \
  */public/locales/*.json)
    ;;
  *)
    # Not a locale file — skip silently
    exit 0
    ;;
esac

# Find the repository root
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$(pwd)"
fi

# Check if the CLI is built
CLI_PATH="$REPO_ROOT/agent-native-i18n/cli/dist/index.js"
if [ ! -f "$CLI_PATH" ]; then
  echo "[i18n-hook] CLI not built at $CLI_PATH — skipping validation"
  exit 0
fi

echo "[i18n-hook] Validating i18n after edit to $(basename "$EDITED_FILE")..."

# Run validation (non-blocking, informational only)
node "$CLI_PATH" validate --root "$REPO_ROOT" 2>&1

VALIDATION_EXIT=$?

if [ $VALIDATION_EXIT -eq 0 ]; then
  echo "[i18n-hook] Validation passed."
else
  echo "[i18n-hook] Validation found issues. Run 'i18n-agent validate --root $REPO_ROOT' for details."
fi

# Always exit 0 so the hook doesn't block Claude
exit 0
