import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'node:fs'
import path from 'node:path'

const BASE = '/'
const SITE_URL = 'https://eytfp.github.io'
const CATEGORIES = ['java-audit', 'intranet']
const OK_ATTACH = ['pdf', 'doc', 'docx']

function copyAttachments() {
  return {
    name: 'copy-attachments',
    closeBundle() {
      const root = path.resolve(process.cwd())
      const dist = path.join(root, '.vitepress', 'dist')
      if (!fs.existsSync(dist)) return
      for (const cat of CATEGORIES) {
        const srcDir = path.join(root, cat)
        const destDir = path.join(dist, cat)
        if (!fs.existsSync(srcDir)) continue
        for (const name of fs.readdirSync(srcDir)) {
          const dot = name.lastIndexOf('.')
          const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
          if (!OK_ATTACH.includes(ext)) continue
          fs.mkdirSync(destDir, { recursive: true })
          fs.copyFileSync(path.join(srcDir, name), path.join(destDir, name))
        }
      }
    }
  }
}

// 构建时扫描文章目录，生成左侧全站文章导航（新文章自动出现，无需手动维护）
function buildSidebar() {
  const root = path.resolve(process.cwd())
  const groupTitles: Record<string, string> = {
    'java-audit': '代码审计',
    'intranet': '内网攻防'
  }
  return CATEGORIES.map((cat) => {
    const dir = path.join(root, cat)
    const items: { text: string; link: string }[] = []
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter((name) => {
          if (name === 'index.md' || name.startsWith('.')) return false
          const dot = name.lastIndexOf('.')
          const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
          return ext === 'md' || OK_ATTACH.includes(ext)
        })
        .map((name) => {
          const dot = name.lastIndexOf('.')
          const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
          const base = dot > 0 ? name.slice(0, dot) : name
          const m = base.match(/^(\d+)\s*[-－—]\s*(.+)$/)
          const num = m ? Number(m[1]) : Number.MAX_SAFE_INTEGER
          const title = m ? m[2].trim() : base.trim()
          const seg = ext === 'md' ? base : name
          return { num, title, link: `/${cat}/${seg}` }
        })
        .sort((a, b) => (a.num !== b.num ? a.num - b.num : a.title.localeCompare(b.title, 'zh-CN')))
      for (const f of files) {
        const label = f.num !== Number.MAX_SAFE_INTEGER ? `${f.num}-${f.title}` : f.title
        items.push({ text: label, link: f.link })
      }
    }
    return { text: groupTitles[cat] || cat, items }
  })
}

export default withMermaid({
  title: 'Security Path Finding',
  description: 'Java 代码审计与内网攻防学习笔记',
  lang: 'zh-CN',
  base: BASE,
  cleanUrls: true,
  markdown: {
    config: (md) => {
      // 文章页自动在正文开头插入内联目录；分类页/首页不插入。
      // 判断依据：相对路径形如 java-audit/xxx.md 或 intranet/xxx.md，且不是 index.md。
      md.core.ruler.push('auto-inline-toc', (state) => {
        const rel = (state.env.relativePath || '').replace(/\\/g, '/')
        const isArticle = CATEGORIES.some(c => rel.startsWith(`${c}/`)) && !rel.endsWith('/index.md')
        if (!isArticle) return true
        const open = new state.Token('html_inline', '', 0)
        open.content = '<InlineToc />'
        state.tokens.unshift(open)
        return true
      })
      // 兼容旧文章里手写的 [TOC]：吞掉它，避免显示成字面文字或与自动目录重复
      const defaultText = md.renderer.rules.text || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))
      md.renderer.rules.text = (tokens, idx, options, env, self) => {
        if (tokens[idx].content.trim() === '[TOC]') return ''
        return defaultText(tokens, idx, options, env, self)
      }
    }
  },
  head: [
    ['meta', { name: 'theme-color', content: '#185FA5' }]
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '代码审计', link: '/java-audit/' },
      { text: '内网攻防', link: '/intranet/' }
    ],
    docFooter: false,
    outline: false,
    sidebar: buildSidebar(),
    lastUpdated: false,
    footer: { message: '内容可能有些错误，多多包涵', copyright: 'Copyright © 2026 eytfp' }
  },
  vite: { plugins: [copyAttachments()] }
})
