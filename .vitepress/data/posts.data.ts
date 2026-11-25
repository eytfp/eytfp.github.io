import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface PostItem {
  num: number
  title: string
  fileName: string
  ext: string
  category: string
  url: string
}

const dataDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dataDir, '../..')
const SECTIONS = ['java-audit/theory', 'java-audit/practice', 'java-audit/misc', 'intranet']
const OK_EXT = ['md', 'pdf', 'doc', 'docx']

function parseFileName(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase() : ''
  const base = dot > 0 ? fileName.slice(0, dot) : fileName
  const m = base.match(/^(\d+)\s*[-－—]\s*(.+)$/)
  if (m) return { num: Number(m[1]), title: m[2].trim(), ext, base }
  return { num: Number.MAX_SAFE_INTEGER, title: base.trim(), ext, base }
}

function scanSection(category: string): PostItem[] {
  const dir = path.join(root, category)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((name) => {
      if (name === 'index.md' || name.startsWith('.')) return false
      const dot = name.lastIndexOf('.')
      const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
      return OK_EXT.includes(ext)
    })
    .map((name) => {
      const p = parseFileName(name)
      const seg = p.ext === 'md' ? p.base : name
      return {
        num: p.num,
        title: p.title,
        fileName: name,
        ext: p.ext,
        category,
        url: `/${category}/${seg}`
      }
    })
}

const all = SECTIONS.flatMap(scanSection)
  .sort((a, b) => (a.num !== b.num ? a.num - b.num : a.title.localeCompare(b.title, 'zh-CN')))

export default {
  watch: SECTIONS.map(s => path.join(root, s)),
  load(): PostItem[] {
    return all
  }
}
