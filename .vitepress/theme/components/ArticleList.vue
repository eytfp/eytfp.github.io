<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from '../../data/posts.data'

const props = defineProps<{ category?: string }>()

const list = computed(() =>
  props.category ? posts.filter(p => p.category === props.category) : posts
)

const typeLabel = (ext: string) => {
  if (ext === 'md') return 'MD'
  if (ext === 'pdf') return 'PDF'
  if (ext === 'doc' || ext === 'docx') return 'DOC'
  return ext.toUpperCase()
}
const typeClass = (ext: string) => (ext === 'md' ? 't-md' : ext === 'pdf' ? 't-pdf' : 't-doc')
const action = (ext: string) => (ext === 'md' ? '在线阅读 →' : '打开 / 下载 →')
const link = (url: string, ext: string) => withBase(ext === 'md' ? url : url)
</script>

<template>
  <div class="article-list">
    <a v-for="post in list" :key="post.fileName" class="al-row" :href="link(post.url, post.ext)"
       :target="post.ext === 'md' ? undefined : '_blank'" :rel="post.ext === 'md' ? undefined : 'noopener'">
      <span class="al-num">{{ post.num === Number.MAX_SAFE_INTEGER ? '·' : post.num }}</span>
      <span class="al-type" :class="typeClass(post.ext)">{{ typeLabel(post.ext) }}</span>
      <span class="al-title">{{ post.title }}</span>
      <span class="al-action">{{ action(post.ext) }}</span>
    </a>
    <p v-if="!list.length" class="al-empty">这里还没有文章。把文件按 <code>数字-标题.后缀</code> 命名放进对应文件夹即可。</p>
  </div>
</template>

<style scoped>
.article-list { margin: 20px 0; }
.al-row { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border: 1px solid var(--vp-c-divider); border-radius: 8px; margin-bottom: 8px; text-decoration: none; color: var(--vp-c-text-1); transition: border-color .2s; }
.al-row:hover { border-color: var(--vp-c-brand-1); }
.al-row:hover .al-title { color: var(--vp-c-brand-1); }
.al-num { font-family: var(--vp-font-family-mono); font-size: 12px; color: var(--vp-c-text-3); width: 20px; text-align: right; }
.al-type { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 5px; min-width: 34px; text-align: center; }
.t-md { background: #E6F1FB; color: #185FA5; }
.t-pdf { background: #FCEBEB; color: #A32D2D; }
.t-doc { background: #EEEDFE; color: #534AB7; }
.al-title { flex: 1; font-size: 14px; }
.al-action { font-size: 12px; color: var(--vp-c-text-2); }
.al-empty { color: var(--vp-c-text-2); font-size: 13px; }
.al-empty code { font-size: 12px; }
</style>
