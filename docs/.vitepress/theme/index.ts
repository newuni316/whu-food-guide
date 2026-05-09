import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import WHUMap from './components/WHUMap.vue'
import AdminPanel from './components/AdminPanel.vue'
import RankingList from './components/RankingList.vue'
import FilterBar from './components/FilterBar.vue'
import RestaurantCard from './components/RestaurantCard.vue'
import MapFilterPanel from './components/MapFilterPanel.vue'
import MapSearchDropdown from './components/MapSearchDropdown.vue'
import MapLegend from './components/MapLegend.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('WHUMap', WHUMap)
    app.component('AdminPanel', AdminPanel)
    app.component('RankingList', RankingList)
    app.component('FilterBar', FilterBar)
    app.component('RestaurantCard', RestaurantCard)
    app.component('MapFilterPanel', MapFilterPanel)
    app.component('MapSearchDropdown', MapSearchDropdown)
    app.component('MapLegend', MapLegend)
  }
} satisfies Theme
