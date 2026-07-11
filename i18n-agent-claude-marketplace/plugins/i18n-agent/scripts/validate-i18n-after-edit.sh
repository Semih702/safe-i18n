#!/usr/bin/env bash
#
# validate-i18n-after-edit.sh
#
# Claude Code PostToolUse hook: runs i18n validation when a locale file is edited.
# Reads hook JSON from stdin to determine the edited file path.
# Only triggers for files in common locale directories.
# Never modifies files. Exits 0 so it never blocks Claude.
#

set -euo pipefail

# Read hook input from stdin (Claude Code passes tool context as JSON)
HOOK_INPUT=""
if [ ! -t 0 ]; then
  HOOK_INPUT=$(cat)
fi

# Extract file_path from hook input
# Attempt lightweight JSON parsing without requiring jq
FILE_PATH=""
if [ -n "$HOOK_INPUT" ]; then
  # Match "file_path": "..." in the JSON
  FILE_PATH=$(echo "$HOOK_INPUT" | grep -oP '"file_path"\s*:\s*"([^"]*)"' | head -1 | sed 's/.*"file_path"\s*:\s*"\([^"]*\)".*/\1/' 2>/dev/null || true)
fi

# If we couldn't extract a file path, skip silently
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only run for JSON files in common locale directories
case "$FILE_PATH" in
  */messages/*.json | */locales/*.json | */locale/*.json | \
  */i18n/*.json | */translations/*.json | */lang/*.json | \
  */langs/*.json | */public/locales/*.json | */assets/locales/*.json)
    ;;
  *)
    exit 0
    ;;
esac

# Resolve the i18n-agent CLI
# First try PATH (plugin bin/ is on PATH when enabled)
if command -v i18n-agent &>/dev/null; then
  I18N_CMD="i18n-agent"
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "${CLAUDE_PLUGIN_ROOT}/bin/i18n-agent" ]; then
  I18N_CMD="${CLAUDE_PLUGIN_ROOT}/bin/i18n-agent"
else
  # CLI not available — skip silently
  exit 0
fi

echo "[i18n-agent] Validating after edit to $(basename "$FILE_PATH")..."

$I18N_CMD validate 2>&1 || true

exit 0
