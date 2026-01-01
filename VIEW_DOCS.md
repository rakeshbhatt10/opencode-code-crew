# 📖 View Documentation

## Quick Start

```bash
cd docs
npm install  # First time only
npm run dev
```

Then open: **http://localhost:5173**

## What You'll See

A beautiful, modern documentation viewer with:

- ✨ **Clean, professional UI** with dark mode
- 🔍 **Powerful search** (Ctrl+K / Cmd+K)
- 📱 **Mobile responsive** design
- ⚡ **Instant updates** with hot reload
- 🎨 **Syntax highlighting** with line numbers
- 📊 **Table of contents** for each page
- 🎯 **Easy navigation** with sidebar

## Features

### Homepage
- Hero section with key features
- Quick links to get started
- Visual architecture diagram
- Cost breakdown and metrics

### Navigation
- **Left Sidebar**: Organized sections (Getting Started, Core Docs, Components, etc.)
- **Right Sidebar**: Table of contents for current page
- **Top Bar**: Search and navigation links
- **Bottom**: Previous/Next page links

### Search
- Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac)
- Type to search across all documentation
- Instant results with context
- Navigate with arrow keys

### Dark Mode
- Automatically detects system preference
- Toggle with button in top-right
- Smooth transitions

## Documentation Structure

```
📚 Getting Started
  ├─ Overview
  ├─ Quick Start
  ├─ Summary
  └─ Quick Reference

📖 Core Documentation
  ├─ System Specification (complete design)
  ├─ Agent Roles (detailed specs)
  ├─ Backlog Schema (task format)
  ├─ Workflow Guide (step-by-step)
  └─ Implementation Plan (build phases)

🔧 System Components
  ├─ Conductor
  ├─ Planning Agents
  ├─ Worker Agents
  └─ Utility Agents

📋 Workflow Stages
  ├─ Stage 0: Intake
  ├─ Stage 1: Planning
  ├─ Stage 2: Backlog
  ├─ Stage 3: Implementation
  └─ Stage 4: Integration

🚀 Implementation Phases
  ├─ Phase 1: MVP
  ├─ Phase 2: Automation
  ├─ Phase 3: Optimization
  └─ Phase 4: Factory Pattern
```

## Alternative Methods

### Using Startup Script
```bash
cd docs
./start-viewer.sh
```

### Using Python (Fallback)
```bash
cd docs
python3 -m http.server 3000
# Open http://localhost:3000
# (Basic, no hot reload)
```

## Commands

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start on specific port
npm run dev -- --port 3000
```

## Tips

- **Bookmark** http://localhost:5173 for quick access
- **Use search** (Ctrl+K) to find anything quickly
- **Print pages** with Ctrl+P - optimized for printing
- **Share on network**: Run `npm run dev -- --host` and access from other devices

## System Requirements

- **Node.js**: 18+ (recommended)
- **npm**: 8+ (comes with Node.js)
- **Browser**: Any modern browser (Chrome, Firefox, Safari, Edge)

## First Time Setup

1. **Install Node.js** (if not already installed):
   - macOS: `brew install node`
   - Ubuntu: `sudo apt install nodejs npm`
   - Windows: Download from https://nodejs.org

2. **Navigate to docs**:
   ```bash
   cd docs
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start viewer**:
   ```bash
   npm run dev
   ```

5. **Open browser**:
   - Automatically opens, or
   - Manually open: http://localhost:5173

## Troubleshooting

### Port already in use
```bash
npm run dev -- --port 3000
```

### Dependencies not installing
```bash
rm -rf node_modules package-lock.json
npm install
```

### Page not updating
- Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Clear cache: `rm -rf .vitepress/cache`
- Restart server

### Search not working
- Search is built-in, should work automatically
- Try clearing browser cache
- Check browser console for errors

## More Information

See [docs/VIEWER_README.md](./docs/VIEWER_README.md) for:
- Customization options
- Deployment guides
- Advanced features
- Full documentation

## Next Steps

1. **Start the viewer** (see Quick Start above)
2. **Read [Getting Started](http://localhost:5173/GETTING_STARTED)** - 30-second overview
3. **Read [System Spec](http://localhost:5173/SYSTEM_SPEC)** - Complete design
4. **Read [Quick Reference](http://localhost:5173/QUICK_REFERENCE)** - Cheat sheet
5. **Start implementing** - Follow [Implementation Plan](http://localhost:5173/IMPLEMENTATION_PLAN)

---

**Enjoy the documentation!** 🚀

