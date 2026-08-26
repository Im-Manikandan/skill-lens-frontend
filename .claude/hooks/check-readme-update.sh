#!/bin/bash
# Claude Code Stop hook: detect source code changes and remind to update README
# Fires when Claude finishes responding. Blocks (exit 2) if src files changed
# and /update-readme hasn't been run yet in this session.

MARKER="$CLAUDE_PROJECT_DIR/.readme-update-pending"

# Check for modified source files (staged + unstaged), excluding README itself
CHANGED_SRC=$(git diff --name-only HEAD 2>/dev/null | grep -E '^src/|^package\.json|^vite\.config|^Dockerfile|^server\.js' | head -1)

# Also check untracked new files in src/
NEW_SRC=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E '^src/' | head -1)

HAS_CHANGES=""
[ -n "$CHANGED_SRC" ] && HAS_CHANGES="1"
[ -n "$NEW_SRC" ] && HAS_CHANGES="1"

if [ -n "$HAS_CHANGES" ] && [ ! -f "$MARKER" ]; then
  # First trigger: create marker and block so Claude runs /update-readme
  touch "$MARKER"
  echo '{"reason": "Source code was modified. Please run /update-readme to keep README.md in sync with the codebase."}'
  exit 2
fi

# Either no changes or marker exists (meaning we already reminded once) — allow stop
rm -f "$MARKER" 2>/dev/null
exit 0
