# Documentation Viewer Guide

> How to run and use the VitePress documentation viewer

---

## 🎯 Quick Start (30 seconds)

1. **Navigate to docs directory:**
   ```bash
   cd docs
   ```

2. **Install dependencies (first time only):**
   ```bash
   pnpm install
   ```

3. **Start the viewer:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   ```
   http://localhost:5173
   ```

That's it! The VitePress documentation viewer will load with:
- ✅ Beautiful, modern UI with dark mode
- ✅ Auto-generated sidebar navigation
- ✅ Powerful local search
- ✅ Syntax highlighting with line numbers
- ✅ Mobile-responsive design
- ✅ Hot module reload (instant updates)

---

## 📖 What You'll See

### Left Sidebar
- **Quick Start** - Getting started, quick reference, OpenCode usage
- **Core Documentation** - All main docs
- **System Components** - Agent details
- **Workflow Stages** - Step-by-step guides
- **Implementation** - Build phases and plans
- **Reference** - Cheat sheets
- **Troubleshooting** - Common issues

### Main Content Area
- Rendered markdown with beautiful styling
- Code blocks with syntax highlighting
- Tables, diagrams, and formatted text
- Search results (use Ctrl+K or Cmd+K)

### Top Bar
- Search box (powered by VitePress)
- Theme toggle (light/dark mode)
- Responsive menu (on mobile)

---

## 🔍 Features

### Search
- Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) to open search
- Type to search across all documentation
- Results show context snippets
- Instant navigation to results

### Navigation
- Click any item in the sidebar to navigate
- Use Previous/Next buttons at bottom of pages
- Breadcrumbs show your current location
- Auto-scroll to active section

### Code Highlighting
Automatic syntax highlighting for:
- TypeScript/JavaScript
- Bash/Shell
- YAML
- JSON
- Python
- Markdown
- And more!

### Mobile Support
- Fully responsive design
- Touch-friendly navigation
- Optimized for phones and tablets
- Collapsible sidebar

---

## 🛠️ Alternative Methods

### Method 1: Using npm

```bash
cd docs
npm install  # First time only
npm run dev
```

### Method 2: Using the Shell Script

```bash
cd docs
./start-viewer.sh
```

### Method 3: Build Static Site

```bash
cd docs
pnpm build
pnpm preview
```

This creates a production build in `docs/.vitepress/dist/`.

---

## 📱 Mobile Viewing

The viewer works great on mobile devices:

1. **Find your computer's IP address:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr IPv4
   ```

2. **Start the server with host flag:**
   ```bash
   cd docs
   pnpm dev --host
   ```

3. **Access from your phone:**
   ```
   http://YOUR_IP_ADDRESS:5173
   ```

---

## 🎨 Customization

### Change Theme Color

Edit `docs/.vitepress/config.ts`:

```typescript
export default {
  themeConfig: {
    // Change accent color
    accentColor: '#42b983',
  }
}
```

### Modify Sidebar

Edit `docs/_sidebar.md` to change navigation structure:

```markdown
* [📋 Quick Start](#)
  * [Getting Started](GETTING_STARTED.md)
  * [Your New Page](YOUR_NEW_PAGE.md)  ← Add here
```

### Add Custom CSS

Create `docs/.vitepress/theme/custom.css`:

```css
:root {
  --vp-c-brand: #42b983;
  --vp-c-brand-light: #42d392;
  --vp-c-brand-dark: #33a06f;
}
```

---

## 🐛 Troubleshooting

### "Cannot find module 'vitepress'"

**Solution:**
```bash
cd docs
rm -rf node_modules
pnpm install
```

### Sidebar not showing

**Solution:** Ensure `_sidebar.md` exists in the `docs/` directory.

### Search not working

**Solution:** Search requires the dev server. Access via `http://localhost:5173`, not `file://`.

### Styling looks broken

**Solution:**
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Check internet connection (VitePress loads fonts from CDN)
3. Try a different browser
4. Restart the dev server

### Port 5173 already in use

**Solution:**
```bash
# Kill the process using the port
lsof -ti:5173 | xargs kill -9

# Or use a different port
pnpm dev --port 3000
```

---

## 📚 Documentation Structure

```
docs/
├── .vitepress/
│   ├── config.ts           # VitePress config
│   └── theme/              # Custom theme
├── _sidebar.md             # Navigation
├── index.md                # Home page
├── GETTING_STARTED.md      # Getting started
├── OPENCODE_USAGE_GUIDE.md # OpenCode guide
├── SYSTEM_SPEC.md          # System design
├── AGENT_ROLES.md          # Agent specs
├── BACKLOG_SCHEMA.md       # Task format
├── WORKFLOW_GUIDE.md       # Operations
├── IMPLEMENTATION_PLAN_*.md # Implementation plans
├── QUICK_REFERENCE.md      # Cheat sheet
└── ...                     # Other docs
```

---

## 🚀 Production Build

### Build for Deployment

```bash
cd docs
pnpm build
```

This creates a static site in `docs/.vitepress/dist/`.

### Preview Production Build

```bash
pnpm preview
```

### Deploy to GitHub Pages

```bash
# Build
pnpm build

# Deploy (example)
cd .vitepress/dist
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:username/repo.git main:gh-pages
```

### Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `cd docs && pnpm build`
3. Set publish directory: `docs/.vitepress/dist`
4. Deploy!

---

## 💡 Tips

- **Bookmark** `http://localhost:5173` for quick access
- **Use search** (Ctrl+K) to quickly find topics
- **Print pages** using browser print (Ctrl+P) - styling is print-friendly
- **Share the viewer** by running with `--host` flag (see Mobile Viewing)
- **Hot reload** - Edit markdown files and see changes instantly

---

## 🎨 VitePress Features

### Markdown Extensions

VitePress supports enhanced markdown:

#### Custom Containers

```markdown
::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger
This is a dangerous warning
:::
```

#### Code Groups

```markdown
::: code-group

```bash [npm]
npm install
```

```bash [pnpm]
pnpm install
```

```bash [yarn]
yarn install
```

:::
```

#### Line Highlighting

```markdown
```typescript {2,4-6}
function hello() {
  console.log('Line 2 is highlighted')
  
  // Lines 4-6 are highlighted
  const x = 1
  const y = 2
}
```
```

---

## 📊 Performance

VitePress is fast:
- ⚡ **Instant hot reload** - See changes immediately
- 🚀 **Fast builds** - Optimized for large documentation sites
- 📦 **Small bundle** - Minimal JavaScript
- 🎯 **SEO friendly** - Static site generation

---

## 🎉 Enjoy!

The documentation viewer makes it easy to navigate and understand the multi-agent system. Happy reading!

For more information about VitePress, visit: https://vitepress.dev/

---

*Back to [Getting Started](GETTING_STARTED.md) | [OpenCode Usage Guide](OPENCODE_USAGE_GUIDE.md)*

