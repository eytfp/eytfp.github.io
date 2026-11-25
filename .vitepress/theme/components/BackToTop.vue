<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
function onScroll() {
  visible.value = window.scrollY > 400
}
function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <button v-if="visible" class="back-to-top" title="返回顶部" aria-label="返回顶部" @click="toTop">↑</button>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: 22px;
  bottom: 26px;
  z-index: 200;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .12);
}
.back-to-top:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
  border-color: var(--vp-c-brand-1);
}
</style>
