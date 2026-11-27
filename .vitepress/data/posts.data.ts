import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSections, scanSection, type ScannedPost } from './scan'

export type PostItem = ScannedPost

const dataDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dataDir, '../..')

const sections = buildSections(root)

export default {
  // 监听两个大类目录：新建/删除子文件夹都会触发重新加载
  watch: sections.map(s => path.join(root, s.key)).concat(
    ['java-audit', 'security'].map(k => path.join(root, k))
  ),
  load(): PostItem[] {
    // 每次 load 都重新扫描，确保新建子文件夹后立即生效
    return buildSections(root).flatMap(s => scanSection(s.key, root))
  }
}
