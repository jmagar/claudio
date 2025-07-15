#!/bin/bash
# Smart Git Commit Script using Claude Code
# Automatically generates commit messages based on staged changes

set -e

# Check if there are staged changes
if ! git diff --cached --quiet; then
    echo "Generating commit message from staged changes..."
    
    # Use claude -p to generate a commit message
    COMMIT_MSG=$(claude -p "Look at the staged git changes and create a concise, descriptive commit message. Follow conventional commits format (feat:, fix:, docs:, etc.). Only respond with the commit message, no extra text.")
    
    echo "Proposed commit message: $COMMIT_MSG"
    read -p "Use this commit message? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git commit -m "$COMMIT_MSG"
        echo "✅ Committed with message: $COMMIT_MSG"
    else
        echo "❌ Commit cancelled"
    fi
else
    echo "No staged changes found. Stage your changes first with 'git add'"
fi