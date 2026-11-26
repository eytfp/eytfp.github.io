import { withMermaid } from 'vitepress-plugin-mermaid'
import fs from 'node:fs'
import path from 'node:path'
import { SECTIONS, OK_ATTACH, scanSection, type ScannedPost } from './data/scan'
import { parentNum } from './shared/hierarchy'

const BASE = '/'

interface SidebarNode {
  text: string
  link: string
  collapsed?: boolean
  items?: SidebarNode[]
}

// 侧栏树形折叠：父子关系复用 parentNum，与列表页完全同一套逻辑。
// 有子级的节点用 VitePress 原生 items + collapsed（默认展开，与列表页一致）。
function sidebarItems(key: string): SidebarNode[] {
  const posts = scanSection(key, process.cwd())
  const nums = new Set(posts.map(p => p.num))
  const byParent = new Map<string, ScannedPost[]>()

  for (const p of posts) {
    const parent = parentNum(p.num)
    // 父级不存在（如只有 1.1 没有 1）时提升为顶层，避免文章消失
    const pk = parent && nums.has(parent) ? parent : ''
    if (!byParent.has(pk)) byParent.set(pk, [])
    byParent.get(pk)!.push(p)
  }

  const build = (pk: string): SidebarNode[] =>
    (byParent.get(pk) || []).map((p) => {
      const base = p.num ? `${p.pin ? '📌 ' : ''}${p.num}-${p.title}` : `${p.pin ? '📌 ' : ''}${p.title}`
      // 无编号文章不可能有子级，直接不给 items，也避免 build('') 自递归
      const children = p.num ? build(p.num) : []
      return children.length
        ? { text: base, link: p.url, collapsed: false, items: children }
        : { text: base, link: p.url }
    })

  return build('')
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

// 把 pdf/doc/docx 附件复制进实际构建目录（跟随 outDir，便于临时目录验证）
function copyAttachments() {
  let outDir = '.vitepress/dist'
  return {
    name: 'copy-attachments',
    configResolved(config: { build: { outDir: string } }) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const root = process.cwd()
      const dist = path.resolve(root, outDir)
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

// 中文搜索分词：英文按词，中文按单字 + 相邻双字（bigram），兼顾"代码""代码审计"等查询
function tokenizeForCJK(text: string): string[] {
  const tokens: string[] = []
  const latin = text.match(/[A-Za-z0-9][A-Za-z0-9._+#-]*/g) || []
  for (const word of latin) tokens.push(word.toLowerCase())
  const cjk = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []
  for (const ch of cjk) tokens.push(ch)
  for (let i = 0; i < cjk.length - 1; i++) tokens.push(cjk[i] + cjk[i + 1])
  return tokens
}

export default withMermaid({
  title: 'Security Path Finding',
  description: 'Notes on Java Code Audit and Intranet Penetration & Defense',
  lang: 'zh-CN',
  base: BASE,
  outDir: 'dist-deadlink-fix',
  cleanUrls: true,
  // 忽略本地调试地址（localhost / 127.0.0.1）的死链；其它失效链接仍会正常报错
  ignoreDeadLinks: [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$|\?|#)/],
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
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文章...', buttonAriaLabel: '搜索文章' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除查询',
            backButtonTitle: '返回',
            noResultsText: '没有找到相关内容',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '选择键',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '向上键',
              navigateDownKeyAriaLabel: '向下键',
              closeText: '关闭',
              closeKeyAriaLabel: '关闭键'
            }
          }
        },
        miniSearch: {
          options: { tokenize: tokenizeForCJK },
          // 中文按单字+双字分词，必须关闭模糊且用 AND，否则单字会误匹配任意汉字
          searchOptions: { prefix: true, fuzzy: 0, combineWith: 'AND', boost: { title: 3 } }
        }
      }
    },
    docFooter: { prev: '上一篇', next: '下一篇' },
    outline: false,
    sidebar: buildSidebar(),
    lastUpdated: {
      text: '更新于',
      formatOptions: { year: 'numeric', month: '2-digit', day: '2-digit' }
    },
    footer: { message: '内容可能有些错误，多多包涵', copyright: 'Copyright © 2026 eytfp' }
  },
  vite: { plugins: [copyAttachments()] }
})
