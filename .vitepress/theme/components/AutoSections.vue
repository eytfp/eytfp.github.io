<script setup lang="ts">
import { computed } from 'vue'
import { data as posts } from '../../data/posts.data'
import ArticleList from './ArticleList.vue'

const props = defineProps<{ category: string }>()

/** 自动发现该大类下的所有子分类（来自扫描到的文章 category），按中文排序 */
const sections = computed(() => {
  const keys = new Set(
    posts.filter(p => p.category.startsWith(props.category + '/')).map(p => p.category)
  )
  return Array.from(keys).sort((a, b) => a.localeCompare(b, 'zh-CN'))
})
</script>

<template>
  <div v-for="key in sections" :key="key" class="auto-section">
    <h2>{{ key.slice(category.length + 1) }}</h2>
    <ArticleList :category="key" />
  </div>
  <p v-if="!sections.length" class="auto-empty">这里还没有文章。新建子文件夹并放入文章后，分类会自动出现在这里。</p>
</template>

<style scoped>
.auto-section { margin-bottom: 32px; }
.auto-empty { color: var(--vp-c-text-3); font-size: 13px; }
</style>
