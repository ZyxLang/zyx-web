import DefaultTheme from 'vitepress/theme'
import ZyxPlayground from './components/ZyxPlayground.vue'
import './custom.css'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('ZyxPlayground', ZyxPlayground)
  },
}
