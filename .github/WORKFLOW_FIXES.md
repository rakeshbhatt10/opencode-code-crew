# 🔧 GitHub Actions Workflow Fixes

## Issue: Cache Dependency Path Error

### Error Message
```
Error: Some specified paths were not resolved, unable to cache dependencies
```

### Root Cause
The `cache-dependency-path` in `actions/setup-node@v4` couldn't find the pnpm lock file in the expected location.

### Solution Applied ✅

Instead of using the built-in cache from `setup-node`, we now:

1. **Manually detect pnpm store path:**
   ```yaml
   - name: Get pnpm store directory
     shell: bash
     run: |
       echo "STORE_PATH=$(cd docs && pnpm store path --silent)" >> $GITHUB_ENV
   ```

2. **Use `actions/cache` directly:**
   ```yaml
   - name: Setup pnpm cache
     uses: actions/cache@v4
     with:
       path: ${{ env.STORE_PATH }}
       key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
       restore-keys: |
         ${{ runner.os }}-pnpm-store-
   ```

### Benefits

- ✅ More reliable caching
- ✅ Works with subdirectory structure
- ✅ Better cache key generation
- ✅ Faster subsequent builds

---

## Testing the Workflow

### Local Testing (Optional)

You can test the build locally before pushing:

```bash
cd docs
pnpm install
pnpm build
```

If this works, the GitHub Action should work too!

### Monitoring the Workflow

1. **Push to main:**
   ```bash
   git push origin main
   ```

2. **Watch the action:**
   ```
   https://github.com/rakeshbhatt10/opencode-code-crew/actions
   ```

3. **Check logs:**
   - Click on the workflow run
   - Expand each step to see details
   - Look for any errors

---

## Common Issues & Solutions

### Issue: "pnpm: command not found"

**Solution:** The workflow already handles this with `pnpm/action-setup@v3`

### Issue: "Module not found" during build

**Solution:** 
- Ensure all dependencies are in `docs/package.json`
- Run `pnpm install` locally to update `pnpm-lock.yaml`
- Commit the updated lock file

### Issue: Build succeeds but site shows 404

**Solution:**
- Check `base` path in `docs/.vitepress/config.mts`
- Should be: `base: '/opencode-code-crew/'`
- Rebuild and redeploy

### Issue: Workflow doesn't trigger

**Solution:**
- Ensure you pushed to `main` branch
- Check that changes are in `docs/**` directory
- Verify workflow file is in `.github/workflows/`

---

## Workflow Triggers

The workflow runs when:

1. **Automatic:**
   - Push to `main` branch
   - Changes in `docs/**` directory
   - Changes to the workflow file itself

2. **Manual:**
   - Go to Actions tab
   - Select "Deploy Documentation to GitHub Pages"
   - Click "Run workflow"

---

## Performance

### First Run
- ~3-5 minutes (no cache)

### Subsequent Runs
- ~1-2 minutes (with cache)

### What's Cached
- pnpm store (node_modules packages)
- Node.js binary (if applicable)

---

## Debugging Tips

### Enable Debug Logging

Add to your workflow:
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

### Check Build Output

Look for these in the logs:
- ✅ "pnpm install" completed successfully
- ✅ "pnpm build" generated files
- ✅ "Upload artifact" shows correct file count
- ✅ "Deploy" shows successful deployment

### Verify Artifact

After build step, check:
- Artifact should contain HTML files
- Should be ~1-5 MB (depending on docs size)
- Should include `index.html`

---

## Optimization Tips

### Reduce Build Time

1. **Use frozen lockfile:**
   ```yaml
   pnpm install --frozen-lockfile
   ```
   ✅ Already implemented

2. **Cache pnpm store:**
   ```yaml
   uses: actions/cache@v4
   ```
   ✅ Already implemented

3. **Limit git history:**
   ```yaml
   fetch-depth: 1  # Only fetch latest commit
   ```
   ⚠️ Not recommended if using git-based features

### Reduce Deployment Frequency

Only trigger on docs changes:
```yaml
paths:
  - 'docs/**'
```
✅ Already implemented

---

## Rollback Procedure

If a deployment breaks the site:

1. **Revert the commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Or deploy a previous version:**
   ```bash
   git checkout <previous-commit>
   git push origin main --force
   ```

3. **Or disable the workflow:**
   - Go to Actions tab
   - Click on the workflow
   - Click "..." menu
   - Select "Disable workflow"

---

## Monitoring

### Check Deployment Status

```bash
# Via GitHub CLI
gh run list --workflow=deploy-docs.yml

# View latest run
gh run view

# Watch live
gh run watch
```

### Check Site Status

```bash
curl -I https://rakeshbhatt10.github.io/opencode-code-crew/
```

Should return `200 OK`

---

## Next Steps

1. ✅ Workflow fixed and committed
2. ⏭️ Push to GitHub
3. ⏭️ Enable GitHub Pages
4. ⏭️ Watch deployment succeed!

---

**The workflow is now ready to deploy your docs! 🚀**

