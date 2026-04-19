import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Drawer, Grid, Layout } from 'antd'
import {
  BookOutlined,
  CheckSquareOutlined,
  NotificationOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ROUTES } from '@/shared/constants/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { uiMessage } from '@/shared/components/feedback/message'
import PageContainer from '@/shared/layout/PageContainer'
import { resolvePageWidthMode } from '@/shared/layout/page-width'
import type { UserRole } from '@/shared/types/user'
import AppLayoutSidebar from '@/shared/layout/app-layout/AppLayoutSidebar'
import AppLayoutHeader from '@/shared/layout/app-layout/AppLayoutHeader'

const { Content, Header, Sider } = Layout
const { useBreakpoint } = Grid
const NotificationBell = lazy(
  () => import('@/features/notifications/components/NotificationBell'),
)

const roleLabelMap: Record<UserRole, string> = {
  admin: '管理员',
  teacher: '教师',
  student: '学生',
}

const workspaceLabelMap: Record<UserRole, string> = {
  admin: '系统管理',
  teacher: '教学工作区',
  student: '学习工作区',
}

const menuRouteMap: Record<string, string> = {
  tasks: ROUTES.TASKS,
  courses: ROUTES.COURSES,
  notifications: ROUTES.NOTIFICATIONS,
  'question-bank': ROUTES.QUESTION_BANK,
  users: ROUTES.USERS,
}

function resolveSelectedKey(pathname: string) {
  const firstSegment = pathname.split('/')[1]
  if (firstSegment === 'question-bank') {
    return 'question-bank'
  }

  if (firstSegment === 'notifications') {
    return 'notifications'
  }

  if (firstSegment === 'users') {
    return 'users'
  }

  if (firstSegment === 'courses') {
    return 'courses'
  }

  if (firstSegment === 'tasks') {
    return 'tasks'
  }

  return ''
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const screens = useBreakpoint()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { currentUser, userRole, hasRole, logout } = useAuthStore()

  const role = userRole()
  const isTabletNav = (screens.md ?? false) && !(screens.lg ?? false)
  const isDesktopNav = screens.lg ?? false
  const hasPersistentNav = isTabletNav || isDesktopNav
  const showCompactNav = isTabletNav
  const siderWidth = screens.xxl ? 300 : screens.xl ? 280 : isDesktopNav ? 248 : 96
  const mobileDrawerWidth = screens.sm
    ? 320
    : 'calc(100vw - 16px - env(safe-area-inset-left) - env(safe-area-inset-right))'
  const selectedKey = resolveSelectedKey(location.pathname)
  const contentWidthMode = resolvePageWidthMode(location.pathname)

  const menuItems = useMemo(() => {
    const items: Array<{ key: string; icon: ReactNode; label: string }> = []

    if (role === 'student') {
      items.push({ key: 'tasks', icon: <CheckSquareOutlined />, label: '任务中心' })
      items.push({ key: 'courses', icon: <BookOutlined />, label: '课程空间' })
      items.push({ key: 'notifications', icon: <NotificationOutlined />, label: '通知中心' })
    }

    if (role === 'teacher') {
      items.push({ key: 'tasks', icon: <CheckSquareOutlined />, label: '任务中心' })
      items.push({ key: 'courses', icon: <BookOutlined />, label: '课程空间' })
      items.push({ key: 'question-bank', icon: <BookOutlined />, label: '题库管理' })
    }

    if (role === 'admin') {
      items.push({ key: 'users', icon: <UserOutlined />, label: '用户管理' })
      items.push({ key: 'courses', icon: <BookOutlined />, label: '课程空间' })
      items.push({ key: 'question-bank', icon: <BookOutlined />, label: '题库管理' })
    }

    return items
  }, [role])

  const userMenuItems = [{ key: 'logout', label: '退出登录' }]

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout()
      uiMessage.success('已退出登录')
      navigate(ROUTES.LOGIN, { replace: true })
      return
    }

    const targetPath = menuRouteMap[key]
    if (targetPath) {
      navigate(targetPath)
      setMobileMenuOpen(false)
    }
  }

  const roleLabel = role ? roleLabelMap[role] : '未登录'
  const workspaceLabel = role ? workspaceLabelMap[role] : '请先登录'
  const userDisplayName = currentUser?.fullName || currentUser?.username || '用户'
  const userRoleLabel = role ? roleLabelMap[role] : '访客'
  const notificationNode = hasRole(['student']) ? (
    <Suspense fallback={null}>
      <NotificationBell />
    </Suspense>
  ) : null

  return (
    <Layout className="app-shell">
      {hasPersistentNav ? (
        <Sider
          width={siderWidth}
          theme="light"
          style={{
            height: 'var(--lms-viewport-height)',
            background: 'transparent',
            borderRight: '1px solid var(--lms-color-border)',
            overflow: 'hidden',
            flex: `0 0 ${siderWidth}px`,
            maxWidth: siderWidth,
            minWidth: siderWidth,
            width: siderWidth,
          }}
        >
          <AppLayoutSidebar
            showCompactNav={showCompactNav}
            selectedKey={selectedKey}
            menuItems={menuItems}
            onMenuClick={handleMenuClick}
            roleLabel={roleLabel}
            workspaceLabel={workspaceLabel}
          />
        </Sider>
      ) : (
        <Drawer
          placement="left"
          width={mobileDrawerWidth}
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          <AppLayoutSidebar
            showCompactNav={showCompactNav}
            selectedKey={selectedKey}
            menuItems={menuItems}
            onMenuClick={handleMenuClick}
            roleLabel={roleLabel}
            workspaceLabel={workspaceLabel}
          />
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            height: 'var(--lms-layout-header-height)',
            padding: 0,
            background: 'rgba(255,250,246,0.9)',
            borderBottom: '1px solid var(--lms-color-border)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <AppLayoutHeader
            hasPersistentNav={hasPersistentNav}
            notificationNode={notificationNode}
            userMenuItems={userMenuItems}
            onMenuClick={handleMenuClick}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            displayName={userDisplayName}
            roleLabel={userRoleLabel}
            avatarUrl={currentUser?.avatar || undefined}
          />
        </Header>

        <Content className="overflow-hidden">
          <div className="app-content-scroll">
            <PageContainer mode={contentWidthMode}>
              <Outlet />
            </PageContainer>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
