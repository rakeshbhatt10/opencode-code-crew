#!/bin/bash

# 🚀 Code Crew - GitHub Push Helper Script
# This script helps you push your code to GitHub by checking common issues

set -e

echo "🎨 Code Crew - GitHub Push Helper"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

echo -e "${BLUE}📍 Current branch:${NC} $(git branch --show-current)"
echo -e "${BLUE}📦 Remote URL:${NC} $(git remote get-url origin)"
echo ""

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    echo ""
    read -p "Do you want to commit them now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📝 Staging all changes...${NC}"
        git add -A
        echo ""
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
        echo -e "${GREEN}✅ Changes committed${NC}"
        echo ""
    fi
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${BLUE}🔍 Checking GitHub repository rules...${NC}"
echo ""
echo -e "${YELLOW}⚠️  If push fails due to repository rules, you need to:${NC}"
echo ""
echo "   1. Visit: https://github.com/rakeshbhatt10/opencode-code-crew/settings/rules"
echo "   2. Find the active ruleset (e.g., 'Default' or 'Protect all branches')"
echo "   3. Either:"
echo "      - Add yourself to the 'Bypass list'"
echo "      - Or temporarily disable the ruleset"
echo ""
read -p "Press Enter to continue with push attempt..."
echo ""

# Try to push
echo -e "${BLUE}🚀 Attempting to push to origin/$CURRENT_BRANCH...${NC}"
echo ""

if git push -u origin "$CURRENT_BRANCH"; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "   1. Visit: https://github.com/rakeshbhatt10/opencode-code-crew"
    echo "   2. Create a Pull Request if needed"
    echo "   3. Review and merge your changes"
    echo ""
    exit 0
else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}❌ Push failed!${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Troubleshooting options:${NC}"
    echo ""
    echo "   Option 1: Fix Repository Rules (Recommended)"
    echo "   ----------------------------------------"
    echo "   1. Visit: https://github.com/rakeshbhatt10/opencode-code-crew/settings/rules"
    echo "   2. Disable or modify the blocking rule"
    echo "   3. Run this script again"
    echo ""
    echo "   Option 2: Use GitHub CLI (if installed)"
    echo "   ----------------------------------------"
    echo "   gh auth login"
    echo "   gh repo view --web"
    echo ""
    echo "   Option 3: Force Push (Use with caution!)"
    echo "   ----------------------------------------"
    echo "   git push --force-with-lease origin $CURRENT_BRANCH"
    echo ""
    echo "   Option 4: Create PR via GitHub Web"
    echo "   ----------------------------------------"
    echo "   1. Visit: https://github.com/rakeshbhatt10/opencode-code-crew"
    echo "   2. Click 'Pull requests' > 'New pull request'"
    echo "   3. Select your branch and create PR"
    echo ""
    exit $EXIT_CODE
fi

