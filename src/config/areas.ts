/**
 * 商圈/区域配置
 *
 * 设计原则：
 * - 数据驱动，新增商圈只需在此文件添加配置
 * - 支持一级区域（校区）和二级区域（商圈）
 * - 前端自动渲染，无需修改页面组件
 */

export interface Area {
  slug: string
  name: string
  icon: string
  description: string
  campus?: string
  isDefault?: boolean
  order: number
}

export interface CampusGroup {
  id: string
  name: string
  icon: string
  areas: Area[]
  order: number
}

export const AREA_CONFIG: CampusGroup[] = [
  {
    id: "xinxixue",
    name: "信息学部",
    icon: "Monitor",
    order: 1,
    areas: [
      {
        slug: "xinxixue",
        name: "信息学部",
        icon: "Monitor",
        description: "信息学部食堂与周边餐厅",
        campus: "xinxixue",
        isDefault: true,
        order: 1,
      },
    ],
  },
  {
    id: "wenli",
    name: "文理学部",
    icon: "BookOpen",
    order: 2,
    areas: [
      {
        slug: "wenli",
        name: "文理学部",
        icon: "BookOpen",
        description: "文理学部食堂与周边餐厅",
        campus: "wenli",
        isDefault: true,
        order: 1,
      },
    ],
  },
  {
    id: "gongxue",
    name: "工学部",
    icon: "Wrench",
    order: 3,
    areas: [
      {
        slug: "gongxue",
        name: "工学部",
        icon: "Wrench",
        description: "工学部食堂与周边餐厅",
        campus: "gongxue",
        isDefault: true,
        order: 1,
      },
    ],
  },
  {
    id: "yixue",
    name: "医学部",
    icon: "Heart",
    order: 4,
    areas: [
      {
        slug: "yixue",
        name: "医学部",
        icon: "Heart",
        description: "医学部食堂与周边餐厅",
        campus: "yixue",
        isDefault: true,
        order: 1,
      },
    ],
  },
  {
    id: "guangbalu",
    name: "广八路",
    icon: "MapPin",
    order: 5,
    areas: [
      {
        slug: "guangbalu",
        name: "广八路",
        icon: "MapPin",
        description: "广八路美食街，武大学生最常去的校外觅食地",
        campus: "guangbalu",
        isDefault: true,
        order: 1,
      },
    ],
  },
  {
    id: "yintai",
    name: "银泰",
    icon: "ShoppingBag",
    order: 6,
    areas: [
      {
        slug: "yintai",
        name: "银泰创意城",
        icon: "ShoppingBag",
        description: "银泰创意城美食广场",
        campus: "yintai",
        isDefault: true,
        order: 1,
      },
    ],
  },
  {
    id: "more",
    name: "更多地点",
    icon: "MoreHorizontal",
    order: 7,
    areas: [
      {
        slug: "jiedaokou",
        name: "街道口",
        icon: "Navigation",
        description: "街道口商圈美食",
        campus: "jiedaokou",
        order: 1,
      },
      {
        slug: "guanggu",
        name: "光谷",
        icon: "Zap",
        description: "光谷广场及周边美食",
        campus: "guanggu",
        order: 2,
      },
      {
        slug: "chuhehanjie",
        name: "楚河汉街",
        icon: "Building",
        description: "楚河汉街餐饮聚集区",
        campus: "chuhehanjie",
        order: 3,
      },
      {
        slug: "xudong",
        name: "徐东",
        icon: "Store",
        description: "徐东商圈美食",
        campus: "xudong",
        order: 4,
      },
      {
        slug: "huquan",
        name: "虎泉",
        icon: "Coffee",
        description: "虎泉夜市及周边小吃",
        campus: "huquan",
        order: 5,
      },
      {
        slug: "yamao",
        name: "亚贸",
        icon: "ShoppingCart",
        description: "亚贸广场周边美食",
        campus: "yamao",
        order: 6,
      },
      {
        slug: "qunguang",
        name: "群光",
        icon: "Gift",
        description: "群光广场美食",
        campus: "qunguang",
        order: 7,
      },
    ],
  },
]

/** 获取所有区域（扁平化） */
export function getAllAreas(): Area[] {
  return AREA_CONFIG.flatMap((group) => group.areas)
}

/** 根据 slug 获取区域信息 */
export function getAreaBySlug(slug: string): Area | undefined {
  return getAllAreas().find((area) => area.slug === slug)
}

/** 获取侧边栏导航项（用于 Sidebar） */
export function getSidebarItems() {
  return AREA_CONFIG.map((group) => ({
    id: group.id,
    name: group.name,
    icon: group.icon,
    areas: group.areas.map((area) => ({
      slug: area.slug,
      name: area.name,
      icon: area.icon,
    })),
  }))
}
