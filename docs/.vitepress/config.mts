import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Code Crew - Multi-Agent Plugin',
  description: 'OpenCode plugin for multi-agent orchestration with context engineering',
  base: '/opencode-code-crew/', // GitHub Pages base path
  
  // Ignore dead links (external project references and localhost URLs)
  ignoreDeadLinks: true,
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/GETTING_STARTED' },
      { text: 'Guide', link: '/SYSTEM_SPEC' },
      { text: 'Reference', link: '/QUICK_REFERENCE' }
    ],

    sidebar: [
      {
        text: '🚀 Getting Started',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/README' },
          { text: '📘 Comprehensive Guide', link: '/COMPREHENSIVE_GUIDE' },
          { text: 'Quick Start', link: '/GETTING_STARTED' },
          { text: 'Summary', link: '/SUMMARY' },
          { text: 'Quick Reference', link: '/QUICK_REFERENCE' }
        ]
      },
      {
        text: '📚 Core Documentation',
        collapsed: false,
        items: [
          { text: 'System Specification', link: '/SYSTEM_SPEC' },
          { text: 'Agent Roles', link: '/AGENT_ROLES' },
          { text: 'Backlog Schema', link: '/BACKLOG_SCHEMA' },
          { text: 'Workflow Guide', link: '/WORKFLOW_GUIDE' },
          { text: 'Implementation Plan', link: '/IMPLEMENTATION_PLAN' }
        ]
      },
      {
        text: '🔧 System Components',
        collapsed: true,
        items: [
          { text: 'Conductor', link: '/SYSTEM_SPEC#conductor-orchestrator' },
          { text: 'Planning Agents', link: '/AGENT_ROLES#2-planning-subagents' },
          { text: 'Worker Agents', link: '/AGENT_ROLES#3-worker-agents' },
          { text: 'Utility Agents', link: '/AGENT_ROLES#4-utility-agents' }
        ]
      },
      {
        text: '📖 Workflow Stages',
        collapsed: true,
        items: [
          { text: 'Stage 0: Intake', link: '/WORKFLOW_GUIDE#stage-0-intake-preparation' },
          { text: 'Stage 1: Planning', link: '/WORKFLOW_GUIDE#stage-1-parallel-planning' },
          { text: 'Stage 2: Backlog', link: '/WORKFLOW_GUIDE#stage-2-backlog-generation' },
          { text: 'Stage 3: Implementation', link: '/WORKFLOW_GUIDE#stage-3-parallel-implementation' },
          { text: 'Stage 4: Integration', link: '/WORKFLOW_GUIDE#stage-4-integration-review' }
        ]
      },
      {
        text: '🚀 Implementation Phases',
        collapsed: true,
        items: [
          { text: 'Phase 1: MVP', link: '/IMPLEMENTATION_PLAN#phase-1-mvp-week-1-2' },
          { text: 'Phase 2: Automation', link: '/IMPLEMENTATION_PLAN#phase-2-automation-week-3-4' },
          { text: 'Phase 3: Optimization', link: '/IMPLEMENTATION_PLAN#phase-3-optimization-week-5-6' },
          { text: 'Phase 4: Factory Pattern', link: '/IMPLEMENTATION_PLAN#phase-4-factory-pattern-week-7-8' }
        ]
      },
      {
        text: '🔨 Implementation Drafts',
        collapsed: true,
        items: [
          { text: 'Claude Army Adaptation', link: '/IMPLEMENTATION_DRAFT_CLAUDE_ARMY' },
          { text: 'OpenCode Conductor Adaptation', link: '/IMPLEMENTATION_DRAFT_OPENCODE_CONDUCTOR' },
          { text: 'Oh My OpenCode Adaptation', link: '/IMPLEMENTATION_DRAFT_OH_MY_OPENCODE' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/rakeshbhatt10/opencode-code-crew' }
    ],

    search: {
      provider: 'local',
      options: {
        detailedView: true
      }
    },

    outline: {
      level: [2, 3],
      label: 'On this page'
    },

    footer: {
      message: 'Built with VitePress',
      copyright: 'Copyright © 2024-2026 Code Crew'
    },

    editLink: {
      pattern: 'https://github.com/rakeshbhatt10/opencode-code-crew/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    }
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'Multi-Agent Coding System' }]
  ]
})

