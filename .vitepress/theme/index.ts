import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import ArticleList from './components/ArticleList.vue'
import AutoSections from './components/AutoSections.vue'
import InlineToc from './components/InlineToc.vue'
import BackToTop from './components/BackToTop.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'layout-bottom': () => h(BackToTop)
  }),
  enhanceApp({ app }) {
    app.component('ArticleList', ArticleList)
    app.component('AutoSections', AutoSections)
    app.component('InlineToc', InlineToc)
  }
}
