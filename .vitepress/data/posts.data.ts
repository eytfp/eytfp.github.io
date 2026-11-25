import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SECTIONS, scanSection, type ScannedPost } from './scan'

export type PostItem = ScannedPost

const dataDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dataDir, '../..')

const all = SECTIONS.flatMap(s => scanSection(s.key, root))

export default {
  watch: SECTIONS.map(s => path.join(root, s.key)),
  load(): PostItem[] {
    return all
  }
}
