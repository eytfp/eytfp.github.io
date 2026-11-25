/**
 * 编号层级逻辑（纯函数，前后端共用）。
 * 规则：编号按小数点逐位拆成路径，小数部分每多一位就深一级。
 *   1     -> [1]        一级
 *   1.1   -> [1,1]      二级
 *   1.11  -> [1,1,1]    三级（1.1 的子级）
 *   1.2   -> [1,2]      二级
 */

/** 编号 -> 层级路径 */
export function numPath(num: string): number[] {
  if (!num) return []
  const dot = num.indexOf('.')
  if (dot < 0) return [Number(num)]
  const head = Number(num.slice(0, dot))
  const tail = num.slice(dot + 1).split('').map(c => Number(c))
  return [head, ...tail]
}

/** 层级路径 -> 编号：[1,1,1] -> '1.11' */
export function pathToNum(path: number[]): string {
  if (!path.length) return ''
  return path.length === 1 ? String(path[0]) : `${path[0]}.${path.slice(1).join('')}`
}

/** 层级（一级 = 0） */
export function numLevel(num: string): number {
  return Math.max(0, numPath(num).length - 1)
}

/** 所有祖先编号，由近到远：1.11 -> ['1.1', '1'] */
export function ancestors(num: string): string[] {
  const path = numPath(num)
  const out: string[] = []
  for (let i = path.length - 1; i >= 1; i--) out.push(pathToNum(path.slice(0, i)))
  return out
}

/** 直接父编号：1.11 -> '1.1'；一级返回空 */
export function parentNum(num: string): string {
  return ancestors(num)[0] || ''
}

/** a 是否为 b 的严格祖先 */
export function isAncestor(a: string, b: string): boolean {
  if (!a || !b) return false
  const pa = numPath(a)
  const pb = numPath(b)
  if (pa.length >= pb.length) return false
  return pa.every((n, i) => n === pb[i])
}

/** 树的前序比较：祖先在前，同级按数值；无编号排最后 */
export function compareNumPath(a: string, b: string): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  const pa = numPath(a)
  const pb = numPath(b)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i]
    const y = pb[i]
    if (x === undefined) return -1
    if (y === undefined) return 1
    if (x !== y) return x - y
  }
  return 0
}
