import { Grid } from 'antd'

const { useBreakpoint } = Grid

export type ResponsiveViewport = 'mobile' | 'tablet' | 'desktop' | 'wide'
export type ResponsiveViewportLevel = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'wide'

export default function useResponsiveLayout() {
  const screens = useBreakpoint()

  const viewportLevel: ResponsiveViewportLevel = screens.xxl
    ? 'wide'
    : screens.xl
      ? 'desktop'
    : screens.lg
      ? 'laptop'
      : screens.md
        ? 'tablet'
        : 'mobile'

  const viewport: ResponsiveViewport =
    viewportLevel === 'laptop' ? 'desktop' : viewportLevel

  return {
    screens,
    viewport,
    viewportLevel,
    isMobile: viewport === 'mobile',
    isTablet: viewport === 'tablet',
    isDesktop: viewport === 'desktop',
    isWide: viewport === 'wide',
    isLaptop: viewportLevel === 'laptop',
    isDesktopUp: screens.lg ?? false,
    isLaptopUp: screens.lg ?? false,
    isDesktopWideUp: screens.xl ?? false,
    isTabletUp: screens.md ?? false,
  }
}
