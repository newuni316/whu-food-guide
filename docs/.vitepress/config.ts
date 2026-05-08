import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '珞珈美食指北',
  description: '武汉大学美食攻略与推荐',
  themeConfig: {
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/whu-food-guide' }
    ],
    nav: [
      { text: '首页', link: '/' },
      {
        text: '校区美食',
        items: [
          { text: '文理学部', link: '/wenli/' },
          { text: '工学部', link: '/gongxue/' },
          { text: '信息学部', link: '/xinxixue/' },
          { text: '医学部', link: '/yixue/' },
          { text: '周边商圈', link: '/surroundings/' }
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
            { text: '概览', link: '/surroundings/' }
          ]
        }
      ]
    }
  }
})
