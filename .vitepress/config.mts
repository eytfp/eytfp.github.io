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

export default withMermaid({
  title: 'Security Path Finding',
  description: 'Java 代码审计与内网攻防学习笔记',
  lang: 'zh-CN',
  base: BASE,
  cleanUrls: true,
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
    lastUpdated: false,
    footer: { message: '内容可能有些错误，多多包涵', copyright: 'Copyright © 2026 eytfp' }
  },
  vite: { plugins: [copyAttachments()] }
})
