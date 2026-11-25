<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useData } from 'vitepress'
import { data as posts } from '../../data/posts.data'

interface Item { text: string; id: string; level: number }
const items = ref<Item[]>([])
const route = useRoute()
const { page } = useData()

const current = computed(() => {
  let path = route.path
  try { path = decodeURI(path) } catch { /* 非法编码时保持原样 */ }
  const p = path.replace(/\/$/, '').replace(/\.html$/, '')
  return posts.find(post => post.url.replace(/\/$/, '') === p)
})

const meta = computed(() => {
  const post = current.value
  const parts: string[] = []
  if (post?.pin) parts.push('置顶')
  if (post?.minutes) parts.push(`约 ${post.minutes} 分钟`)
  if (post?.tags?.length) parts.push(post.tags.join(' · '))
  const raw = page.value.lastUpdated
  if (raw) {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) {
      parts.push(`更新于 ${d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}`)
    }
  }
  return parts.join('　')
})

function collect() {
  nextTick(() => {
    const heads = document.querySelectorAll<HTMLElement>('.vp-doc h2, .vp-doc h3')
    items.value = Array.from(heads).map(h => ({
      text: (h.textContent || '').replace('¶', '').trim(),
      id: h.id,
      level: Number(h.tagName.slice(1))
    })).filter(i => i.id)
  })
}

onMounted(collect)
watch(() => route.path, () => setTimeout(collect, 60))
</script>

<template>
  <nav v-if="items.length || meta" class="inline-toc">
    <div v-if="meta" class="inline-toc-meta">{{ meta }}</div>
    <div v-if="items.length" class="inline-toc-title">目录</div>
    <a v-for="(item, i) in items" :key="i" :href="`#${item.id}`" class="inline-toc-item"
       :style="{ paddingLeft: `${(item.level - 2) * 18}px` }">
      {{ item.text }}
    </a>
  </nav>
</template>

<style scoped>
.inline-toc {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px 18px;
  margin: 16px 0 28px;
  background: var(--vp-c-bg-soft);
}
.inline-toc-meta {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--vp-c-divider);
}
.inline-toc-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-bottom: 8px;
}
.inline-toc-item {
  display: block;
  font-size: 13px;
  line-height: 1.9;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.inline-toc-item:hover { color: var(--vp-c-brand-1); }
</style>
