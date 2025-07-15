#!/bin/bash
# Code Review Script using Claude Code
# Analyzes code changes and provides feedback

set -e

# Default to reviewing the last commit if no arguments provided
TARGET=${1:-"HEAD~1..HEAD"}

echo "🔍 Analyzing code changes in $TARGET..."

# Get the diff and pipe it to Claude for review
git diff $TARGET | claude -p "
Review this code diff for:
1. Potential bugs or issues
2. Code quality and best practices
3. Security concerns
4. Performance implications
5. Suggestions for improvement

Provide a concise summary with specific line-by-line feedback where relevant.
Use markdown formatting for better readability.
"