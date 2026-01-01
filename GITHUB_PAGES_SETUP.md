# 📘 GitHub Pages Setup Guide

This guide will help you deploy your Code Crew documentation to GitHub Pages.

## 🎯 What We've Set Up

✅ **GitHub Action workflow** (`.github/workflows/deploy-docs.yml`)  
✅ **VitePress configuration** updated with correct base path  
✅ **Automatic deployment** on push to `main` branch  
✅ **Manual deployment** option via workflow dispatch

---

## 🚀 Setup Steps

### Step 1: Enable GitHub Pages

1. **Go to your repository settings:**
   ```
   https://github.com/rakeshbhatt10/opencode-code-crew/settings/pages
   ```

2. **Under "Build and deployment":**
   - **Source:** Select `GitHub Actions`
   - (Don't select "Deploy from a branch" - we're using Actions)

3. **Save the settings**

### Step 2: Push Your Code

Once you've resolved the secret scanning issue and pushed your code:

```bash
# Make sure you're on the feature branch
git status

# Push to GitHub (after allowing the secret)
git push -u origin feature/initial-code

# Create and merge a PR to main
# OR switch to main and merge
git checkout main
git merge feature/initial-code
git push origin main
```

### Step 3: Wait for Deployment

1. **Go to Actions tab:**
   ```
   https://github.com/rakeshbhatt10/opencode-code-crew/actions
   ```

2. **Watch the workflow run:**
   - You'll see "Deploy Documentation to GitHub Pages"
   - It takes about 2-3 minutes

3. **Once complete, your docs will be live at:**
   ```
   https://rakeshbhatt10.github.io/opencode-code-crew/
   ```

---

## 🔧 How It Works

### Automatic Deployment

The workflow automatically runs when:
- ✅ You push to the `main` branch
- ✅ Changes are made to `docs/**` files
- ✅ The workflow file itself is modified

### Manual Deployment

You can also trigger deployment manually:

1. Go to Actions tab
2. Select "Deploy Documentation to GitHub Pages"
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

---

## 📁 Workflow Details

The GitHub Action does the following:

1. **Checkout code** - Gets your repository
2. **Setup pnpm** - Installs pnpm package manager
3. **Setup Node.js** - Installs Node.js v20
4. **Install dependencies** - Runs `pnpm install` in `docs/`
5. **Build docs** - Runs `pnpm build` to generate static site
6. **Upload artifact** - Prepares the built site
7. **Deploy** - Publishes to GitHub Pages

---

## 🎨 Configuration Changes Made

### `.github/workflows/deploy-docs.yml`
- Created GitHub Actions workflow
- Configured for automatic and manual deployment
- Set up proper permissions for GitHub Pages

### `docs/.vitepress/config.mts`
- Updated `base` path to `/opencode-code-crew/`
- Updated GitHub links to your repository
- Updated title to "Code Crew - Multi-Agent Plugin"
- Updated copyright year

---

## 🔍 Troubleshooting

### Issue: Workflow doesn't run

**Solution:**
- Check that GitHub Pages source is set to "GitHub Actions"
- Ensure you pushed to the `main` branch
- Check Actions tab for any errors

### Issue: 404 errors on deployed site

**Solution:**
- Verify the `base` path in `config.mts` matches your repo name
- Should be: `base: '/opencode-code-crew/'`
- Rebuild and redeploy

### Issue: Build fails

**Solution:**
- Check the Actions logs for specific errors
- Ensure `docs/package.json` has all required dependencies
- Verify `pnpm-lock.yaml` is committed

### Issue: Pages not updating

**Solution:**
- GitHub Pages can take 1-2 minutes to update
- Clear your browser cache
- Try incognito/private browsing mode

---

## 📋 Checklist

Before deploying:

- [ ] Secret scanning issue resolved (allow the secret)
- [ ] Code pushed to GitHub
- [ ] GitHub Pages source set to "GitHub Actions"
- [ ] Merged to `main` branch (or pushed directly)
- [ ] Workflow completed successfully
- [ ] Site accessible at `https://rakeshbhatt10.github.io/opencode-code-crew/`

---

## 🎉 After Deployment

Once your docs are live:

1. **Update README.md** with the docs link:
   ```markdown
   📚 **Documentation:** https://rakeshbhatt10.github.io/opencode-code-crew/
   ```

2. **Add to repository description:**
   - Go to repository home
   - Click the ⚙️ gear icon
   - Add website: `https://rakeshbhatt10.github.io/opencode-code-crew/`
   - Add description: "OpenCode plugin for multi-agent orchestration"

3. **Share the link:**
   - Add to your README
   - Share on social media
   - Include in npm package description

---

## 🔄 Updating Documentation

To update your docs in the future:

```bash
# Make changes to files in docs/
vim docs/GETTING_STARTED.md

# Commit and push to main
git add docs/
git commit -m "docs: update getting started guide"
git push origin main

# GitHub Actions will automatically rebuild and deploy!
```

---

## 📚 Additional Resources

- [VitePress Documentation](https://vitepress.dev/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 🎯 Next Steps

1. **Resolve the secret scanning issue** (see `PUSH_ISSUE_RESOLVED.md`)
2. **Push your code to GitHub**
3. **Enable GitHub Pages** (Step 1 above)
4. **Watch the magic happen!** ✨

Your documentation will be automatically built and deployed every time you push to `main`!

---

**Questions?** Check the troubleshooting section or open an issue on GitHub.

**Good luck! 🚀**

