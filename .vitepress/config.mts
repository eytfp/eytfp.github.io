import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'node:fs'
import path from 'node:path'

const BASE = '/'
const SITE_URL = 'https://eytfp.github.io'
const OK_ATTACH = ['pdf', 'doc', 'docx']

// 文章分区：key 是相对仓库根的目录路径，label 用于左侧导航
const SECTIONS = [
  { key: 'java-audit/theory', label: 'Theory', group: 'code' },
  { key: 'java-audit/practice', label: 'Practice', group: 'code' },
  { key: 'java-audit/misc', label: 'Misc', group: 'code' },
  { key: 'intranet', label: 'Intranet Penetration & Defense', group: 'intranet' }
]

function parseFileName(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase() : ''
  const base = dot > 0 ? fileName.slice(0, dot) : fileName
  const m = base.match(/^(\d+)\s*[-－—]\s*(.+)$/)
  if (m) return { num: Number(m[1]), title: m[2].trim(), ext, base }
  return { num: Number.MAX_SAFE_INTEGER, title: base.trim(), ext, base }
}

function scanSection(key: string) {
  const root = process.cwd()
  const dir = path.join(root, key)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((name) => {
      if (name === 'index.md' || name.startsWith('.')) return false
      const dot = name.lastIndexOf('.')
      const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
      return ext === 'md' || OK_ATTACH.includes(ext)
    })
    .map((name) => {
      const p = parseFileName(name)
      const seg = p.ext === 'md' ? p.base : name
      return { num: p.num, title: p.title, link: `/${key}/${seg}` }
    })
    .sort((a, b) => (a.num !== b.num ? a.num - b.num : a.title.localeCompare(b.title, 'zh-CN')))
}

function sidebarItems(key: string) {
  return scanSection(key).map((i) => {
    const label = i.num !== Number.MAX_SAFE_INTEGER ? `${i.num}-${i.title}` : i.title
    return { text: label, link: i.link }
  })
}

// 构建时扫描文章目录，生成左侧全站文章导航（新文章自动出现，无需手动维护）
function buildSidebar() {
  const codeItems = SECTIONS.filter(s => s.group === 'code').map(s => ({
    text: s.label,
    collapsed: false,
    items: sidebarItems(s.key)
  }))
  const intranet = SECTIONS.find(s => s.group === 'intranet')!
  return [
    { text: 'Code Audit', collapsed: false, items: codeItems },
    { text: 'Intranet Penetration & Defense', collapsed: false, items: sidebarItems(intranet.key) }
  ]
}

function copyAttachments() {
  return {
    name: 'copy-attachments',
    closeBundle() {
      const root = process.cwd()
      const dist = path.join(root, '.vitepress', 'dist')
      if (!fs.existsSync(dist)) return
      for (const s of SECTIONS) {
        const srcDir = path.join(root, s.key)
        const destDir = path.join(dist, s.key)
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

export default withMermaid({
  title: 'Security Path Finding',
  description: 'Notes on Java Code Audit and Intranet Penetration & Defense',
  lang: 'zh-CN',
  base: BASE,
  cleanUrls: true,
  markdown: {
    config: (md) => {
      // 文章页自动在正文标题下插入内联目录；分类页/首页不插入。
      md.core.ruler.push('auto-inline-toc', (state) => {
        const rel = (state.env.relativePath || '').replace(/\\/g, '/')
        const isArticle = SECTIONS.some(s => rel.startsWith(`${s.key}/`)) && !rel.endsWith('/index.md')
        if (!isArticle) return true
        const open = new state.Token('html_inline', '', 0)
        open.content = '<InlineToc />'
        let insertAt = -1
        for (let i = 0; i < state.tokens.length; i++) {
          const t = state.tokens[i]
          if (t.type === 'heading_close' && t.tag === 'h1') { insertAt = i + 1; break }
        }
        state.tokens.splice(insertAt < 0 ? 0 : insertAt, 0, open)
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
      { text: 'Home', link: '/' },
      { text: 'Code Audit', link: '/java-audit/' },
      { text: 'Intranet Penetration & Defense', link: '/intranet/' }
    ],
    docFooter: false,
    outline: false,
    sidebar: buildSidebar(),
    lastUpdated: false,
    footer: { message: '内容可能有些错误，多多包涵', copyright: 'Copyright © 2026 eytfp' }
  },
  vite: { plugins: [copyAttachments()] }
})
