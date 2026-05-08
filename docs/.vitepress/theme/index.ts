import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import WHUMap from './components/WHUMap.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('WHUMap', WHUMap)
  }
} satisfies Theme
