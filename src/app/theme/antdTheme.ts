import type { ThemeConfig } from 'antd'

const theme: ThemeConfig = {
  token: {
    // 主色：暖橙色，兼顾学习场景的活力和专业感
    colorPrimary: '#ff6b35',
    colorLink: '#ff6b35',
    colorLinkHover: '#ff9a3c',

    // 背景与边框
    colorBgBase: '#fff9f5',
    colorBorderSecondary: '#e7ddd6',

    // 文字
    colorTextBase: '#1c1917',
    colorTextSecondary: '#78716c',

    // 圆角
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,

    // 字体
    fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,

    // 阴影
    boxShadow: '0 2px 12px rgba(255, 107, 53, 0.08), 0 1px 4px rgba(0,0,0,0.06)',
    boxShadowSecondary: '0 4px 20px rgba(255, 107, 53, 0.12)',
  },
  components: {
    Button: {
      colorPrimaryHover: '#ff9a3c',
      colorPrimaryActive: '#e85a25',
      borderRadius: 10,
      controlHeight: 40,
      fontWeight: 600,
    },
    Input: {
      colorBorder: '#e7ddd6',
      colorBgContainer: '#fdfaf7',
      borderRadius: 10,
      controlHeight: 40,
    },
    Menu: {
      colorItemBgSelected: 'rgba(255, 107, 53, 0.1)',
      colorItemTextSelected: '#ff6b35',
      colorItemBgHover: 'rgba(255, 107, 53, 0.06)',
      colorActiveBarBorderSize: 3,
      itemBorderRadius: 8,
    },
    Card: {
      colorBorderSecondary: '#e7ddd6',
      borderRadius: 14,
    },
    Table: {
      colorFillAlter: '#fdf8f4',
      borderRadius: 10,
    },
    Layout: {
      colorBgHeader: '#ffffff',
      colorBgBody: '#fff9f5',
      colorBgTrigger: '#ff6b35',
    },
    Tabs: {
      colorPrimary: '#ff6b35',
      inkBarColor: '#ff6b35',
    },
    Tag: {
      borderRadius: 6,
    },
  },
}

export default theme
