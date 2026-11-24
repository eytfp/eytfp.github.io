import DefaultTheme from 'vitepress/theme'
import ArticleList from './components/ArticleList.vue'
import InlineToc from './components/InlineToc.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ArticleList', ArticleList)
    app.component('InlineToc', InlineToc)
  }
}
