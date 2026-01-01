#!/bin/bash

# 🧹 Clean Git History - Remove .pnpm-store from all commits
# This script removes the .pnpm-store directory from git history

set -e

echo "🧹 Code Crew - Git History Cleaner"
echo "===================================="
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "⚠️  All commit hashes will change!"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Aborted."
    exit 1
fi

echo "🔍 Checking for .pnpm-store in history..."
if git log --all --full-history --format="%H" -- "*pnpm-store*" | head -1 > /dev/null 2>&1; then
    echo "✅ Found .pnpm-store in history"
else
    echo "✅ No .pnpm-store found in history"
    exit 0
fi

echo ""
echo "🧹 Removing .pnpm-store from all commits..."
echo ""

# Use git filter-repo if available, otherwise use filter-branch
if command -v git-filter-repo &> /dev/null; then
    echo "Using git-filter-repo (recommended)..."
    git filter-repo --path .pnpm-store --invert-paths --force
else
    echo "Using git filter-branch (slower)..."
    export FILTER_BRANCH_SQUELCH_WARNING=1
    git filter-branch --force --index-filter \
        'git rm -rf --cached --ignore-unmatch .pnpm-store' \
        --prune-empty --tag-name-filter cat -- --all
    
    # Clean up
    rm -rf .git/refs/original/
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
fi

echo ""
echo "✅ History cleaned!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify the history: git log --oneline"
echo "   2. Force push: git push --force-with-lease origin feature/initial-code"
echo ""
echo "⚠️  Note: Force pushing will affect anyone who has cloned this repo!"
echo ""

