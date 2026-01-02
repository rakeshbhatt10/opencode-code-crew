# Local Plugin Setup Guide

> Complete guide for setting up and using Code Crew as a local OpenCode plugin

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Code Crew can be used as a **local plugin** in your OpenCode projects. This allows you to:

- ✅ Use Code Crew in any project without publishing to npm
- ✅ Develop and test plugin changes locally
- ✅ Customize the plugin for your specific needs
- ✅ Keep your plugin code private

---

## ✅ Prerequisites

Before setting up the plugin locally, ensure you have:

- ✅ **OpenCode CLI** installed (`npm install -g @opencode-ai/cli`)
- ✅ **Node.js** v18+ and **pnpm** v8+
- ✅ **Bun** runtime (`bun --version`)
- ✅ **Git** installed
- ✅ OpenCode authentication configured (see [Getting Started](GETTING_STARTED.md))

---

## 📦 Installation Methods

OpenCode supports two ways to load plugins locally:

### Method 1: Project-Level Plugin (Recommended)

Place the plugin in your project's `.opencode/plugin/` directory.

**Step 1: Create plugin directory**

```bash
mkdir -p .opencode/plugin
```

**Step 2: Link or copy the plugin**

**Option A: Symlink (for development)**

```bash
# From your project root
ln -s /path/to/opencode-code-crew/src .opencode/plugin/code-crew
```

**Option B: Copy files (for production)**

```bash
# Copy the built plugin
cp -r /path/to/opencode-code-crew/dist .opencode/plugin/code-crew
```

**Option C: Git submodule (for version control)**

```bash
# Add as submodule
git submodule add https://github.com/rakeshbhatt10/opencode-code-crew.git .opencode/plugin/code-crew

# Initialize and update
git submodule update --init --recursive
```

**Step 3: Build the plugin**

```bash
cd /path/to/opencode-code-crew
pnpm install
pnpm build
```

**Step 4: Create plugin entry point**

Create `.opencode/plugin/code-crew.ts`:

```typescript
// Import from the built plugin
import codeCrew from "../dist/index.js";

export default codeCrew;
```

Or if using symlink:

```typescript
// Import from source
import codeCrew from "./code-crew/src/index.js";

export default codeCrew;
```

---

### Method 2: Global Plugin

Install the plugin globally for use across all projects.

**Step 1: Create global plugin directory**

```bash
mkdir -p ~/.config/opencode/plugin
```

**Step 2: Link or copy the plugin**

```bash
# Symlink for development
ln -s /path/to/opencode-code-crew/src ~/.config/opencode/plugin/code-crew

# Or copy built files
cp -r /path/to/opencode-code-crew/dist ~/.config/opencode/plugin/code-crew
```

**Step 3: Create plugin entry point**

Create `~/.config/opencode/plugin/code-crew.ts`:

```typescript
import codeCrew from "./code-crew/dist/index.js";

export default codeCrew;
```

---

## ⚙️ Configuration

### 1. Add Plugin Dependencies

If your plugin uses external npm packages, create a `package.json` in your config directory:

**.opencode/package.json** (for project-level):

```json
{
  "name": "opencode-code-crew-deps",
  "dependencies": {
    "@opencode-ai/plugin": "latest",
    "@opencode-ai/sdk": "latest",
    "js-yaml": "^4.1.0",
    "p-limit": "^5.0.0",
    "p-retry": "^6.2.0"
  }
}
```

**~/.config/opencode/package.json** (for global):

```json
{
  "name": "opencode-code-crew-global-deps",
  "dependencies": {
    "@opencode-ai/plugin": "latest",
    "@opencode-ai/sdk": "latest",
    "js-yaml": "^4.1.0",
    "p-limit": "^5.0.0",
    "p-retry": "^6.2.0"
  }
}
```

OpenCode will automatically run `bun install` at startup to install these dependencies.

---

### 2. Configure OpenCode

Add the plugin to your OpenCode configuration file.

**Project-level** (`.opencode/opencode.json` or `opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": []
}
```

> **Note:** Local plugins in `.opencode/plugin/` are automatically loaded, so you don't need to add them to the `plugin` array. The array is for npm packages only.

**Global** (`~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": []
}
```

---

### 3. Environment Variables

Set required API keys:

```bash
# Required: Google AI (for free-tier planning)
export GOOGLE_API_KEY="your-gemini-api-key"

# Required: OpenAI (for implementation)
export OPENAI_API_KEY="your-openai-api-key"
```

Or create a `.env` file in your project root:

```bash
# .env
GOOGLE_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```

---

## 🚀 Usage

Once installed, Code Crew tools are available in OpenCode sessions.

### Basic Workflow

**1. Start an OpenCode session:**

```bash
opencode run
```

**2. Use Code Crew tools:**

```
# Plan a feature
plan --context_file=feature.md --output_dir=tasks

# Generate backlog
backlog --plan_file=tasks/PLAN.md --track_id=my-feature

# Implement tasks
implement --backlog_file=tasks/BACKLOG.yaml

# Rebase failed task
rebase --task_id=T05 --failure_logs="Error: ..."
```

### Example Session

```bash
# Start OpenCode
opencode run

# In the OpenCode session:
> plan --context_file=feature.md
Planning complete. Plan: tasks/PLAN.md

> backlog --plan_file=tasks/PLAN.md --track_id=health-check
Backlog generated: tasks/BACKLOG.yaml

> implement --backlog_file=tasks/BACKLOG.yaml
Implementation complete: 3/3 tasks succeeded
```

---

## 🔧 Development Workflow

### Setup for Development

**1. Clone and build the plugin:**

```bash
git clone https://github.com/rakeshbhatt10/opencode-code-crew.git
cd opencode-code-crew
pnpm install
pnpm build
```

**2. Link to your project:**

```bash
# From your project root
mkdir -p .opencode/plugin
ln -s $(pwd)/../opencode-code-crew/src .opencode/plugin/code-crew
```

**3. Create plugin entry point:**

Create `.opencode/plugin/code-crew.ts`:

```typescript
import codeCrew from "./code-crew/src/index.js";

export default codeCrew;
```

**4. Enable watch mode (optional):**

```bash
# In the plugin directory
pnpm build --watch
```

### Testing Changes

**1. Make changes to the plugin code**

**2. Rebuild:**

```bash
cd /path/to/opencode-code-crew
pnpm build
```

**3. Restart OpenCode:**

```bash
# OpenCode will reload plugins on restart
opencode run
```

**4. Test the changes:**

```
> plan --context_file=test-feature.md
```

### Debugging

**Enable debug logging:**

```bash
export DEBUG=opencode:*
opencode run
```

**Check plugin loading:**

OpenCode will log plugin loading at startup. Look for:

```
✓ Loaded plugin: code-crew
```

**Verify tools are available:**

```
> help
# Should list code-crew tools: plan, backlog, implement, rebase
```

---

## 📁 Directory Structure

### Project-Level Setup

```
your-project/
├── .opencode/
│   ├── plugin/
│   │   ├── code-crew.ts          # Plugin entry point
│   │   └── code-crew/            # Symlink or copy
│   │       ├── src/
│   │       └── dist/
│   └── package.json              # Plugin dependencies
├── opencode.json                  # OpenCode config
└── .env                           # API keys
```

### Global Setup

```
~/.config/opencode/
├── plugin/
│   ├── code-crew.ts              # Plugin entry point
│   └── code-crew/                 # Symlink or copy
│       ├── src/
│       └── dist/
├── package.json                   # Plugin dependencies
└── opencode.json                  # Global config
```

---

## 🔍 Load Order

OpenCode loads plugins in this order:

1. **Global config** (`~/.config/opencode/opencode.json`) - npm plugins
2. **Project config** (`opencode.json`) - npm plugins
3. **Global plugin directory** (`~/.config/opencode/plugin/`) - local plugins
4. **Project plugin directory** (`.opencode/plugin/`) - local plugins

**Important:** Project-level plugins override global plugins with the same name.

---

## 🐛 Troubleshooting

### Issue: Plugin not loading

**Symptoms:**
- Tools not available in OpenCode
- No plugin loading message

**Solutions:**

1. **Check plugin directory:**

```bash
ls -la .opencode/plugin/
# Should show code-crew.ts or code-crew/
```

2. **Verify entry point:**

```bash
cat .opencode/plugin/code-crew.ts
# Should export the plugin function
```

3. **Check build output:**

```bash
cd /path/to/opencode-code-crew
ls -la dist/
# Should show built files
```

4. **Restart OpenCode:**

```bash
# Kill any running OpenCode processes
pkill -f opencode
opencode run
```

---

### Issue: Module not found errors

**Symptoms:**
```
Error: Cannot find module '@opencode-ai/plugin'
```

**Solutions:**

1. **Install dependencies:**

```bash
cd .opencode
bun install
```

2. **Check package.json:**

```bash
cat .opencode/package.json
# Should list @opencode-ai/plugin
```

3. **Clear cache:**

```bash
rm -rf ~/.cache/opencode/node_modules
opencode run  # Will reinstall
```

---

### Issue: TypeScript errors

**Symptoms:**
- Type errors in plugin code
- Build fails

**Solutions:**

1. **Check TypeScript config:**

```bash
cd /path/to/opencode-code-crew
cat tsconfig.json
```

2. **Rebuild:**

```bash
pnpm build
```

3. **Check imports:**

Ensure all imports use `.js` extensions (required for ESM):

```typescript
import { CONFIG } from "./config.js";  // ✅ Correct
import { CONFIG } from "./config";      // ❌ Wrong
```

---

### Issue: Tools not available

**Symptoms:**
- `plan`, `backlog`, `implement` commands not found
- `help` doesn't show Code Crew tools

**Solutions:**

1. **Verify plugin exports tools:**

```typescript
// .opencode/plugin/code-crew.ts
import codeCrew from "./code-crew/src/index.js";

export default codeCrew;
// Should return { tools: { plan, backlog, ... } }
```

2. **Check plugin structure:**

```bash
cd /path/to/opencode-code-crew
cat src/index.ts | grep "tools:"
# Should show tools object
```

3. **Restart OpenCode:**

```bash
opencode run
```

---

### Issue: Permission errors

**Symptoms:**
- Cannot write to `.opencode/plugin/`
- Cannot create symlinks

**Solutions:**

1. **Check permissions:**

```bash
ls -la .opencode/
# Should show write permissions
```

2. **Fix permissions:**

```bash
chmod -R u+w .opencode/
```

3. **Use copy instead of symlink:**

```bash
cp -r /path/to/opencode-code-crew/dist .opencode/plugin/code-crew
```

---

## 📚 Additional Resources

- **[Getting Started Guide](GETTING_STARTED.md)** - Quick start with Code Crew
- **[OpenCode Usage Guide](OPENCODE_USAGE_GUIDE.md)** - Complete command reference
- **[OpenCode Plugin Docs](https://opencode.ai/docs/plugins)** - Official plugin documentation

---

## 🎯 Quick Reference

### Setup Commands

```bash
# Project-level
mkdir -p .opencode/plugin
ln -s /path/to/opencode-code-crew/src .opencode/plugin/code-crew
echo 'import codeCrew from "./code-crew/src/index.js"; export default codeCrew;' > .opencode/plugin/code-crew.ts

# Global
mkdir -p ~/.config/opencode/plugin
ln -s /path/to/opencode-code-crew/src ~/.config/opencode/plugin/code-crew
echo 'import codeCrew from "./code-crew/src/index.js"; export default codeCrew;' > ~/.config/opencode/plugin/code-crew.ts

# Install dependencies
cd .opencode && bun install
```

### Verify Installation

```bash
# Check plugin directory
ls -la .opencode/plugin/

# Check entry point
cat .opencode/plugin/code-crew.ts

# Start OpenCode and test
opencode run
> help  # Should show code-crew tools
```

---

**Happy coding with Code Crew!** 🚀

