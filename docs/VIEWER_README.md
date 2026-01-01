# Documentation Viewer

This directory contains a modern documentation viewer built with [VitePress](https://vitepress.dev/).

## Quick Start

### Recommended: Using VitePress (Best Experience)

```bash
cd docs
npm install  # First time only
npm run dev
```

Then open: **http://localhost:5173**

### Alternative: Using Startup Script

```bash
cd docs
./start-viewer.sh
```

The script will auto-detect available tools and use the best option.

## Features

### ✨ Modern UI
- Beautiful, clean design
- Dark mode support (auto-detects system preference)
- Smooth animations and transitions
- Professional typography

### 🔍 Powerful Search
- Local search (no external dependencies)
- Instant results as you type
- Search across all documentation
- Keyboard shortcuts (Ctrl+K / Cmd+K)

### 📱 Responsive Design
- Mobile-friendly navigation
- Touch-optimized interface
- Adaptive layout for all screen sizes

### ⚡ Developer Experience
- Hot module reload (instant updates)
- Fast build times with Vite
- TypeScript support
- Vue 3 powered

### 🎨 Rich Content
- Syntax highlighting with line numbers
- Code block copy buttons
- Emoji support
- Custom containers (tip, warning, danger)
- Table of contents for each page

## Available Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start dev server on port 3000
npm run serve

# Alternative start command
npm start
```

## File Structure

```
docs/
├── .vitepress/
│   ├── config.mts          # VitePress configuration
│   └── theme/
│       ├── index.ts        # Theme entry
│       └── custom.css      # Custom styles
├── public/
│   ├── hero-image.svg      # Homepage hero image
│   └── logo.svg            # Site logo
├── index.md                # Homepage
├── README.md               # Documentation overview
├── SYSTEM_SPEC.md          # System specification
├── AGENT_ROLES.md          # Agent details
├── BACKLOG_SCHEMA.md       # Task schema
├── WORKFLOW_GUIDE.md       # Operations guide
├── IMPLEMENTATION_PLAN.md  # Build plan
├── SUMMARY.md              # High-level summary
├── QUICK_REFERENCE.md      # Cheat sheet
├── GETTING_STARTED.md      # Getting started guide
└── package.json            # Dependencies
```

## Customization

### Change Theme Colors

Edit `.vitepress/theme/custom.css`:

```css
:root {
  --vp-c-brand-1: #42b983;  /* Primary color */
  --vp-c-brand-2: #35a372;  /* Hover color */
  --vp-c-brand-3: #299764;  /* Active color */
}
```

### Modify Navigation

Edit `.vitepress/config.mts`:

```typescript
export default defineConfig({
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide' }
    ],
    sidebar: [
      // Your sidebar configuration
    ]
  }
})
```

### Add Custom Components

1. Create component in `.vitepress/theme/components/`
2. Import in `.vitepress/theme/index.ts`
3. Use in markdown files

### Custom CSS

Add styles to `.vitepress/theme/custom.css`. They will be automatically loaded.

## Advanced Features

### Custom Containers

```markdown
::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger
This is a danger message
:::

::: details Click to expand
Hidden content here
:::
```

### Code Groups

```markdown
::: code-group
```bash [npm]
npm install vitepress
```

```bash [pnpm]
pnpm add vitepress
```
:::
```

### Badges

```markdown
<Badge type="info" text="new" />
<Badge type="tip" text="beta" />
<Badge type="warning" text="deprecated" />
<Badge type="danger" text="breaking" />
```

## Deployment

### GitHub Pages

1. Update `.vitepress/config.mts`:
```typescript
export default defineConfig({
  base: '/repo-name/', // Your repo name
  // ...
})
```

2. Build:
```bash
npm run build
```

3. Deploy `.vitepress/dist` to GitHub Pages

### Netlify

1. Build command: `npm run build`
2. Publish directory: `docs/.vitepress/dist`
3. Deploy

### Vercel

1. Import repository
2. Framework preset: VitePress
3. Build command: `npm run build`
4. Output directory: `docs/.vitepress/dist`
5. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--port", "3000"]
```

## Troubleshooting

### Port Already in Use

VitePress uses port 5173 by default. To change:

```bash
npm run dev -- --port 3000
```

Or edit `package.json`:
```json
{
  "scripts": {
    "dev": "vitepress dev --port 3000"
  }
}
```

### Build Errors

Clear cache and reinstall:
```bash
rm -rf node_modules .vitepress/cache
npm install
npm run build
```

### Search Not Working

Search is built-in and works automatically. If issues persist:
1. Clear browser cache
2. Rebuild: `npm run build`
3. Check console for errors

### Styling Issues

1. Clear VitePress cache: `rm -rf .vitepress/cache`
2. Hard refresh browser: Ctrl+Shift+R (Cmd+Shift+R on Mac)
3. Check custom CSS for conflicts

### Hot Reload Not Working

1. Check file watcher limits (Linux):
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

2. Restart dev server

## Performance

VitePress is extremely fast:
- **Dev server**: Starts in <1 second
- **Hot reload**: Updates in <100ms
- **Build time**: ~10 seconds for this documentation
- **Page load**: <100ms (after initial load)

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Comparison with Other Tools

| Feature | VitePress | Docsify | GitBook |
|---------|-----------|---------|---------|
| Speed | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| SEO | ✅ | ❌ | ✅ |
| Build required | Yes | No | Yes |
| Hot reload | ✅ | ✅ | ✅ |
| Search | Built-in | Plugin | Built-in |
| Customization | High | Medium | Low |

## Tips & Tricks

### Keyboard Shortcuts

- `Ctrl+K` / `Cmd+K`: Open search
- `/`: Focus search
- `Esc`: Close search/sidebar

### Mobile Navigation

- Tap hamburger menu for sidebar
- Swipe left/right to navigate
- Tap "On this page" for table of contents

### Print Documentation

Use browser print (Ctrl+P / Cmd+P). VitePress has print-optimized styles.

### Share Links

VitePress generates clean URLs:
- ✅ `/SYSTEM_SPEC.html` → `/SYSTEM_SPEC`
- ✅ Anchor links work: `/SYSTEM_SPEC#conductor`

## Resources

- [VitePress Documentation](https://vitepress.dev/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)

## License

Same as the main project.
