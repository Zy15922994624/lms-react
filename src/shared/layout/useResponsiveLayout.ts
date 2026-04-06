import { Grid } from 'antd'

const { useBreakpoint } = Grid

export type ResponsiveViewport = 'mobile' | 'tablet' | 'desktop' | 'wide'

export default function useResponsiveLayout() {
  const screens = useBreakpoint()

  const viewport: ResponsiveViewport = screens.xxl
    ? 'wide'
    : screens.lg
      ? 'desktop'
      : screens.md
        ? 'tablet'
        : 'mobile'

  return {
    screens,
    viewport,
    isMobile: viewport === 'mobile',
    isTablet: viewport === 'tablet',
    isDesktop: viewport === 'desktop',
    isWide: viewport === 'wide',
    isDesktopUp: screens.lg ?? false,
    isTabletUp: screens.md ?? false,
  }
}
