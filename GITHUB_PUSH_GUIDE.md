# 🚀 GitHub Push Guide - Code Crew

## Quick Start

### Option 1: Use the Helper Script (Recommended)

```bash
./push-to-github.sh
```

The script will:
- ✅ Check your git status
- ✅ Commit any pending changes (if you want)
- ✅ Attempt to push
- ✅ Provide troubleshooting steps if it fails

---

## Manual Push Steps

### Step 1: Commit Your Changes

```bash
# Check status
git status

# Stage all changes
git add -A

# Commit
git commit -m "feat: initial release of Code Crew plugin"
```

### Step 2: Push to GitHub

```bash
# Push current branch
git push -u origin $(git branch --show-current)
```

---

## 🔧 If Push Fails: "Repository Rule Violations"

### Root Cause
GitHub has repository-wide rules that block **all** pushes (not just to protected branches).

### Solution: Disable Repository Rules

1. **Visit Repository Settings:**
   ```
   https://github.com/rakeshbhatt10/opencode-code-crew/settings/rules
   ```

2. **Find the Active Ruleset:**
   - Look for "Default" or "Protect all branches"
   - It will show as "Active"

3. **Choose One:**
   
   **Option A: Add Yourself to Bypass List** (Recommended)
   - Click on the ruleset
   - Scroll to "Bypass list"
   - Add your username
   - Click "Save changes"
   
   **Option B: Temporarily Disable**
   - Click on the ruleset
   - Toggle it off
   - Push your code
   - Re-enable it later

4. **Push Again:**
   ```bash
   git push -u origin feature/initial-code
   ```

---

## 🔑 If You Get "Permission Denied (publickey)"

### Quick Fix: Switch to HTTPS

```bash
# Check current remote
git remote -v

# If it shows SSH (git@github.com), switch to HTTPS
git remote set-url origin https://github.com/rakeshbhatt10/opencode-code-crew.git

# Push again
git push -u origin feature/initial-code
```

### Or: Fix SSH Keys

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Then add it to GitHub:
# https://github.com/settings/keys
```

---

## 🎯 Alternative: Use GitHub CLI

If you have GitHub CLI installed:

```bash
# Login
gh auth login

# Create PR directly
gh pr create --title "Initial Release" --body "First release of Code Crew plugin"
```

---

## 📋 Current Branch Status

Your current setup:
- **Branch:** `feature/initial-code`
- **Remote:** `https://github.com/rakeshbhatt10/opencode-code-crew.git`
- **Issue:** Repository rules blocking push

---

## ✅ Success Checklist

After successful push:

- [ ] Code is pushed to GitHub
- [ ] Create Pull Request (if using feature branch)
- [ ] Review changes on GitHub
- [ ] Merge to main
- [ ] Add release tag
- [ ] Update documentation

---

## 🆘 Still Having Issues?

### Check Repository Permissions

1. Visit: `https://github.com/rakeshbhatt10/opencode-code-crew/settings`
2. Ensure you have:
   - Admin or Write access
   - No restrictions on your account

### Check GitHub Status

Visit: `https://www.githubstatus.com/`

### Contact Support

If all else fails:
- GitHub Support: https://support.github.com/
- Check repository collaborators and permissions

---

## 🎨 Next Steps After Successful Push

1. **Create Release:**
   ```bash
   git tag -a v1.0.0 -m "Initial release"
   git push origin v1.0.0
   ```

2. **Update README:**
   - Add installation instructions
   - Add usage examples
   - Add badges

3. **Publish to npm:**
   ```bash
   pnpm publish --access public
   ```

4. **Announce:**
   - Share on social media
   - Update OpenCode plugin directory
   - Write blog post

---

## 📚 Resources

- [GitHub Repository Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub SSH Keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [GitHub CLI](https://cli.github.com/)

---

**Good luck! 🚀**

