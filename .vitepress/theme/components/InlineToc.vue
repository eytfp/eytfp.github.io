<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

interface Item { text: string; id: string; level: number }
const items = ref<Item[]>([])
const route = useRoute()

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
  <nav v-if="items.length" class="inline-toc">
    <div class="inline-toc-title">目录</div>
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
