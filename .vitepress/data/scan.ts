import fs from 'node:fs'
import path from 'node:path'
import { numLevel, compareNumPath } from '../shared/hierarchy'

// 文章分区：key 是相对仓库根的目录路径，label 用于左侧导航
export const SECTIONS = [
  { key: 'java-audit/theory', label: 'Theory', group: 'code' },
  { key: 'java-audit/practice', label: 'Practice', group: 'code' },
  { key: 'java-audit/misc', label: 'Misc', group: 'code' },
  { key: 'intranet', label: 'Intranet Penetration & Defense', group: 'intranet' }
]

export const OK_ATTACH = ['pdf', 'doc', 'docx']
export const OK_EXT = ['md', ...OK_ATTACH]

export interface PostMeta {
  /** 置顶文章排在同级最前面 */
  pin: boolean
  /** 标签，来自文章 frontmatter 的 tags 字段 */
  tags: string[]
}

export interface ScannedPost extends PostMeta {
  num: string
  /** 层级：小数点后的位数，1=0 / 1.1=1 / 1.11=2，用于列表与导航缩进 */
  level: number
  title: string
  fileName: string
  ext: string
  category: string
  url: string
  /** 字数（中文字 + 英文词） */
  words: number
  /** 预计阅读分钟数 */
  minutes: number
}

function unquote(s: string) {
  return s.trim().replace(/^['"]|['"]$/g, '')
}

/** 读取文章 frontmatter 中的 pin / tags；没有 frontmatter 时返回默认值。 */
export function readMeta(filePath: string): PostMeta {
  if (!filePath || !fs.existsSync(filePath)) return { pin: false, tags: [] }
  const text = fs.readFileSync(filePath, 'utf8')
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!fm) return { pin: false, tags: [] }

  const lines = fm[1].split(/\r?\n/)
  let pin = false
  const tags: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const pinMatch = line.match(/^\s*pin\s*:\s*(true|false)\s*(?:#.*)?$/i)
    if (pinMatch) {
      pin = pinMatch[1].toLowerCase() === 'true'
      continue
    }
    const inline = line.match(/^\s*tags\s*:\s*\[(.*?)\]\s*(?:#.*)?$/)
    if (inline) {
      inline[1].split(',').map(unquote).filter(Boolean).forEach(t => tags.push(t))
      continue
    }
    if (/^\s*tags\s*:\s*(?:#.*)?$/.test(line)) {
      for (let j = i + 1; j < lines.length; j++) {
        const item = lines[j].match(/^\s*-\s+(.+?)\s*(?:#.*)?$/)
        if (!item) break
        const t = unquote(item[1])
        if (t) tags.push(t)
      }
    }
  }
  return { pin, tags: Array.from(new Set(tags)) }
}

/** 统计中文字数与英文词数：中文按 400 字/分钟，英文按 200 词/分钟。 */
export function countReading(text: string): { words: number; minutes: number } {
  const body = text
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s{4,}.*$/gm, ' ')
  const cjk = (body.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
  const en = (body.match(/[A-Za-z0-9][A-Za-z0-9'’._+#-]*/g) || []).length
  const minutes = Math.max(1, Math.round(cjk / 400 + en / 200))
  return { words: cjk + en, minutes }
}

export function parseFileName(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase() : ''
  const base = dot > 0 ? fileName.slice(0, dot) : fileName
  const m = base.match(/^(\d+(?:\.\d+)?)\s*[-－—]\s*(.+)$/)
  if (m) return { num: m[1], title: m[2].trim(), ext, base }
  return { num: '', title: base.trim(), ext, base }
}

/** 排序规则：置顶优先 → 编号树前序（父在前、子紧跟）→ 标题（中文排序） */
export function sortPosts<T extends { num: string; title: string; pin: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.pin !== b.pin) return a.pin ? -1 : 1
    const c = compareNumPath(a.num, b.num)
    return c !== 0 ? c : a.title.localeCompare(b.title, 'zh-CN')
  })
}

export function scanSection(key: string, root: string): ScannedPost[] {
  const dir = path.join(root, key)
  if (!fs.existsSync(dir)) return []

  const items = fs.readdirSync(dir)
    .filter((name) => {
      if (name === 'index.md' || name.startsWith('.')) return false
      const dot = name.lastIndexOf('.')
      const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
      return OK_EXT.includes(ext)
    })
    .map((name) => {
      const p = parseFileName(name)
      const seg = p.ext === 'md' ? p.base : name
      const full = path.join(dir, name)
      const meta = p.ext === 'md' ? readMeta(full) : { pin: false, tags: [] as string[] }
      const reading = p.ext === 'md' ? countReading(fs.readFileSync(full, 'utf8')) : { words: 0, minutes: 0 }
      return {
        num: p.num,
        level: numLevel(p.num),
        title: p.title,
        fileName: name,
        ext: p.ext,
        category: key,
        url: `/${key}/${seg}`,
        tags: meta.tags,
        pin: meta.pin,
        words: reading.words,
        minutes: reading.minutes
      }
    })

  return sortPosts(items)
}
