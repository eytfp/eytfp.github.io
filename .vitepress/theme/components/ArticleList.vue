<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from '../../data/posts.data'
import { ancestors, isAncestor } from '../../shared/hierarchy'

const props = defineProps<{ category?: string }>()

const activeTag = ref('')
const previewPost = ref<(typeof posts)[number] | null>(null)
const collapsed = ref<Set<string>>(new Set())

const scoped = computed(() =>
  props.category ? posts.filter(p => p.category === props.category) : posts
)

const tags = computed(() =>
  Array.from(new Set(scoped.value.flatMap(p => p.tags))).sort((a, b) => a.localeCompare(b, 'zh-CN'))
)

const tagged = computed(() =>
  activeTag.value ? scoped.value.filter(p => p.tags.includes(activeTag.value)) : scoped.value
)

/** 是否有后代（决定显示折叠箭头） */
const hasChildren = (num: string) => scoped.value.some(p => isAncestor(num, p.num))
const isCollapsed = (num: string) => collapsed.value.has(num)
function toggle(num: string) {
  const next = new Set(collapsed.value)
  next.has(num) ? next.delete(num) : next.add(num)
  collapsed.value = next
}

/** 按标签筛选后，再隐藏被折叠节点的所有后代 */
const list = computed(() => tagged.value.filter(p =>
  !ancestors(p.num).some(a => collapsed.value.has(a))
))


const typeLabel = (ext: string) => {
  if (ext === 'md') return 'MD'
  if (ext === 'pdf') return 'PDF'
  if (ext === 'doc' || ext === 'docx') return 'DOC'
  return ext.toUpperCase()
}
const typeClass = (ext: string) => (ext === 'md' ? 't-md' : ext === 'pdf' ? 't-pdf' : 't-doc')
const action = (ext: string) => (ext === 'md' ? '阅读 →' : '打开 / 下载 →')
const link = (url: string) => withBase(url)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') previewPost.value = null
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="article-list">
    <div v-if="tags.length" class="al-filters">
      <span class="al-filter-label">标签</span>
      <button class="al-filter" :class="{ active: !activeTag }" @click="activeTag = ''">全部</button>
      <button v-for="tag in tags" :key="tag" class="al-filter" :class="{ active: activeTag === tag }"
              @click="activeTag = tag">{{ tag }}</button>
    </div>

    <div v-for="post in list" :key="post.fileName" class="al-row"
         :style="{ paddingLeft: (14 + post.level * 32) + 'px' }">
      <button v-if="hasChildren(post.num)" class="al-fold" :aria-label="isCollapsed(post.num) ? '展开' : '折叠'"
              @click="toggle(post.num)">{{ isCollapsed(post.num) ? '▸' : '▾' }}</button>
      <span v-else class="al-fold-space"></span>
      <a class="al-main" :href="link(post.url)"
         :target="post.ext === 'md' ? undefined : '_blank'" :rel="post.ext === 'md' ? undefined : 'noopener'">
        <span class="al-num" :class="{ 'is-parent': hasChildren(post.num) }">{{ post.num || '·' }}</span>
        <span class="al-type" :class="typeClass(post.ext)">{{ typeLabel(post.ext) }}</span>
        <span class="al-body">
          <span class="al-title">
            <span v-if="post.pin" class="al-pin">置顶</span>{{ post.title }}
          </span>
          <span v-if="post.tags.length || post.minutes" class="al-sub">
            <span v-for="tag in post.tags" :key="tag" class="al-tag">{{ tag }}</span>
            <span v-if="post.minutes" class="al-minutes">约 {{ post.minutes }} 分钟</span>
          </span>
        </span>
        <span class="al-action">{{ action(post.ext) }}</span>
      </a>
      <button v-if="post.ext === 'pdf'" class="al-preview-btn"
              @click="previewPost = post">预览</button>
    </div>

    <p v-if="!list.length" class="al-empty">
      {{ activeTag ? '该标签下暂无文章。' : '这里还没有文章。把文件按 数字-标题.后缀 命名放进对应文件夹即可。' }}
    </p>

    <teleport to="body">
      <div v-if="previewPost" class="pv-overlay" @click.self="previewPost = null">
        <div class="pv-dialog">
          <div class="pv-head">
            <span class="pv-title">{{ previewPost.title }}</span>
            <span class="pv-tools">
              <a :href="link(previewPost.url)" target="_blank" rel="noopener">新窗口打开</a>
              <button @click="previewPost = null">关闭 ✕</button>
            </span>
          </div>
          <iframe class="pv-frame" :src="link(previewPost.url)" :title="previewPost.title" />
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.article-list { margin: 20px 0; }
.al-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }
.al-filter-label { font-size: 12px; color: var(--vp-c-text-3); margin-right: 2px; }
.al-filter { font-size: 12px; padding: 3px 11px; border-radius: 20px; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); cursor: pointer; transition: all .2s; }
.al-filter:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.al-filter.active { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: #fff; }
.al-row { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border: 1px solid var(--vp-c-divider); border-radius: 8px; margin-bottom: 8px; transition: border-color .2s; }
.al-row:hover { border-color: var(--vp-c-brand-1); }
.al-fold { flex: none; width: 16px; height: 20px; padding: 0; border: 0; background: transparent; color: var(--vp-c-text-3); font-size: 12px; cursor: pointer; }
.al-fold:hover { color: var(--vp-c-brand-1); }
.al-fold-space { flex: none; width: 16px; }
.al-num.is-parent { color: var(--vp-c-brand-1); font-weight: 600; }
.al-row:hover .al-title { color: var(--vp-c-brand-1); }
.al-main { display: flex; flex: 1; min-width: 0; align-items: center; gap: 12px; text-decoration: none; color: var(--vp-c-text-1); }
.al-num { font-family: var(--vp-font-family-mono); font-size: 12px; color: var(--vp-c-text-3); min-width: 32px; text-align: right; flex: none; }
.al-type { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 5px; min-width: 34px; text-align: center; flex: none; }
.t-md { background: #E6F1FB; color: #185FA5; }
.t-pdf { background: #FCEBEB; color: #A32D2D; }
.t-doc { background: #EEEDFE; color: #534AB7; }
.al-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.al-title { font-size: 14px; }
.al-pin { font-size: 10px; color: #fff; background: #A32D2D; border-radius: 4px; padding: 1px 5px; margin-right: 6px; vertical-align: 1px; }
.al-sub { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.al-tag { font-size: 10px; color: var(--vp-c-text-3); background: var(--vp-c-bg-soft); border-radius: 4px; padding: 1px 6px; }
.al-minutes { font-size: 10px; color: var(--vp-c-text-3); }
.al-action { font-size: 12px; color: var(--vp-c-text-2); flex: none; }
.al-preview-btn { font-size: 11px; padding: 3px 8px; border: 1px solid var(--vp-c-brand-3); border-radius: 5px; background: transparent; color: var(--vp-c-brand-1); cursor: pointer; flex: none; }
.al-preview-btn:hover { background: var(--vp-c-brand-1); color: #fff; }
.al-empty { color: var(--vp-c-text-2); font-size: 13px; }
.al-empty code { font-size: 12px; }

.pv-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; padding: 4vh 4vw; }
.pv-dialog { width: min(1000px, 100%); height: 92vh; display: flex; flex-direction: column; background: var(--vp-c-bg); border-radius: 10px; overflow: hidden; box-shadow: 0 12px 48px rgba(0,0,0,.3); }
.pv-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; border-bottom: 1px solid var(--vp-c-divider); font-size: 14px; }
.pv-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pv-tools { display: flex; align-items: center; gap: 14px; flex: none; font-size: 12px; }
.pv-tools a { color: var(--vp-c-brand-1); text-decoration: none; }
.pv-tools button { border: 1px solid var(--vp-c-divider); border-radius: 5px; background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); padding: 3px 9px; cursor: pointer; }
.pv-frame { flex: 1; width: 100%; border: 0; background: #fff; }
</style>
