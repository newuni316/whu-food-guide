import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '珞珈美食指北',
  description: '武汉大学美食攻略与推荐',
  themeConfig: {
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/newuni316/whu-food-guide' }
    ],
    nav: [
      { text: '首页', link: '/' },
      {
        text: '校区美食',
        items: [
          { text: '文理学部', link: '/wenli/' },
          { text: '工学部', link: '/gongxue/' },
          { text: '信息学部', link: '/xinxixue/' },
          { text: '医学部', link: '/yixue/' }
        ]
      },
      {
        text: '周边商圈',
        items: [
          { text: '广八路', link: '/surroundings/guangbalu/' },
          { text: '街道口', link: '/surroundings/jiedaokou/' },
          { text: '商圈总览', link: '/surroundings/' }
        ]
      },
      {
        text: '排行榜',
        items: [
          { text: '🏆 口碑 Top 10', link: '/rankings/top10' },
          { text: '💕 约会必去榜', link: '/rankings/date-night' },
          { text: '⚠️ 避雷专区', link: '/rankings/avoid' }
        ]
      },
      { text: '地图总览', link: '/map' },
      { text: '关于', link: '/about' }
    ],
    sidebar: {
      '/wenli/': [
        {
          text: '文理学部',
          items: [
            { text: '概览', link: '/wenli/' }
          ]
        }
      ],
      '/gongxue/': [
        {
          text: '工学部',
          items: [
            { text: '概览', link: '/gongxue/' }
          ]
        }
      ],
      '/xinxixue/': [
        {
          text: '信息学部',
          items: [
            { text: '概览', link: '/xinxixue/' }
          ]
        }
      ],
      '/yixue/': [
        {
          text: '医学部',
          items: [
            { text: '概览', link: '/yixue/' }
          ]
        }
      ],
      '/surroundings/': [
        {
          text: '周边商圈',
          items: [
            { text: '商圈总览', link: '/surroundings/' },
            { text: '广八路', link: '/surroundings/guangbalu/' },
            { text: '街道口', link: '/surroundings/jiedaokou/' }
          ]
        }
      ],
      '/rankings/': [
        {
          text: '排行榜',
          items: [
            { text: '🏆 口碑 Top 10', link: '/rankings/top10' },
            { text: '💕 约会必去榜', link: '/rankings/date-night' },
            { text: '⚠️ 避雷专区', link: '/rankings/avoid' }
          ]
        }
      ]
    }
  }
})
